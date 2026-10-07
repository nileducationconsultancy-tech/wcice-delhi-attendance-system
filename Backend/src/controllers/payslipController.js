const Payslip = require('../models/PayslipModel');
const Employee = require('../models/EmployeeModel');
const { generateSinglePayslip, generateBulkPayslips, calculatePayslipFigures } = require('../services/payrollService');
const { buildPayslipPDF } = require('../services/payslipPDFService');
const { getISTDateString } = require('../utils/dateUtils');

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

const adminFilter = {
    status: 'ACTIVE',
    ...(ADMIN_EMAIL ? { email: { $ne: ADMIN_EMAIL } } : {})
};

// GET /api/admin/payslips
const getPayslips = async (req, res) => {
    try {
        const now = new Date();
        const dateStr = getISTDateString(now);
        const currentYear = parseInt(dateStr.split('-')[0]);
        const currentMonth = parseInt(dateStr.split('-')[1]);

        const month = parseInt(req.query.month) || currentMonth;
        const year = parseInt(req.query.year) || currentYear;
        const status = req.query.status;
        const employeeIdFilter = req.query.employeeId;
        const search = req.query.search?.trim();

        // Build query
        const query = { month, year };
        if (status) query.paymentStatus = status;
        if (employeeIdFilter) query.employee = employeeIdFilter;

        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } }
            ];
        }

        const [payslips, totalEmployeesCount] = await Promise.all([
            Payslip.find(query).populate('employee', 'profilePicture').sort({ employeeName: 1 }).lean(),
            Employee.countDocuments(adminFilter)
        ]);

        // Calculate KPI summary figures
        let totalGrossSalary = 0;
        let totalDeductions = 0;
        let totalNetPayroll = 0;

        payslips.forEach(p => {
            totalGrossSalary += p.grossSalary || 0;
            totalDeductions += p.totalDeduction || 0;
            totalNetPayroll += p.netSalary || 0;
        });

        res.status(200).json({
            month,
            year,
            summary: {
                totalEmployees: totalEmployeesCount,
                payslipsGenerated: payslips.length,
                totalGrossSalary: Math.round(totalGrossSalary),
                totalDeductions: Math.round(totalDeductions),
                totalNetPayroll: Math.round(totalNetPayroll)
            },
            payslips
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching payslips', error: error.message });
    }
};

// GET /api/admin/payslips/:id
const getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id)
            .populate('employee', 'name email employeeId designation department joiningDate baseSalary workSchedule')
            .lean();

        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found' });
        }

        res.status(200).json(payslip);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching payslip', error: error.message });
    }
};

// POST /api/admin/payslips/generate (Single)
const generatePayslip = async (req, res) => {
    try {
        const { employeeId, month, year, bonus, incentive, otherDeductions, remarks, paymentStatus } = req.body;

        if (!employeeId || !month || !year) {
            return res.status(400).json({ message: 'employeeId, month, and year are required' });
        }

        const manualAdjustments = {
            bonus: Number(bonus || 0),
            incentive: Number(incentive || 0),
            otherDeductions: Number(otherDeductions || 0),
            remarks: remarks || '',
            paymentStatus: paymentStatus || 'Pending'
        };

        const payslip = await generateSinglePayslip(
            employeeId, 
            parseInt(month), 
            parseInt(year), 
            manualAdjustments, 
            req.user?._id
        );

        res.status(201).json({
            message: `Payslip for ${payslip.employeeName} generated successfully`,
            payslip
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error generating payslip' });
    }
};

// POST /api/admin/payslips/generate-all (Bulk)
const generateAllPayslips = async (req, res) => {
    try {
        const { month, year } = req.body;

        if (!month || !year) {
            return res.status(400).json({ message: 'month and year are required' });
        }

        const result = await generateBulkPayslips(parseInt(month), parseInt(year), req.user?._id);

        res.status(200).json({
            message: `Successfully generated/updated ${result.totalGenerated} payslips for ${month}/${year}`,
            ...result
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error generating bulk payslips' });
    }
};

// PUT /api/admin/payslips/:id/regenerate
const regeneratePayslip = async (req, res) => {
    try {
        const existing = await Payslip.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Payslip not found' });
        }

        const manualAdjustments = {
            bonus: req.body.bonus !== undefined ? Number(req.body.bonus) : existing.bonus,
            incentive: req.body.incentive !== undefined ? Number(req.body.incentive) : existing.incentive,
            otherDeductions: req.body.otherDeductions !== undefined ? Number(req.body.otherDeductions) : existing.otherDeductions,
            remarks: req.body.remarks !== undefined ? req.body.remarks : existing.remarks,
            paymentStatus: req.body.paymentStatus || existing.paymentStatus
        };

        const updatedPayslip = await generateSinglePayslip(
            existing.employee, 
            existing.month, 
            existing.year, 
            manualAdjustments, 
            req.user?._id
        );

        res.status(200).json({
            message: 'Payslip regenerated successfully from current attendance data',
            payslip: updatedPayslip
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error regenerating payslip' });
    }
};

// PUT /api/admin/payslips/:id (Edit Adjustments & Status)
const updatePayslip = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id);
        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found' });
        }

        const { bonus, incentive, otherDeductions, remarks, paymentStatus } = req.body;

        if (bonus !== undefined) payslip.bonus = Math.max(0, Number(bonus));
        if (incentive !== undefined) payslip.incentive = Math.max(0, Number(incentive));
        if (otherDeductions !== undefined) payslip.otherDeductions = Math.max(0, Number(otherDeductions));
        if (remarks !== undefined) payslip.remarks = remarks;
        if (paymentStatus) payslip.paymentStatus = paymentStatus;

        // Recalculate totals
        const lateDed = Number(payslip.lateDeduction || 0);
        payslip.grossSalary = Number((payslip.monthlySalary + payslip.bonus + payslip.incentive).toFixed(2));
        payslip.totalDeduction = Number(((payslip.absentDeduction || 0) + (payslip.halfDayDeduction || 0) + lateDed + (payslip.otherDeductions || 0)).toFixed(2));
        payslip.netSalary = Number(Math.max(0, payslip.grossSalary - payslip.totalDeduction).toFixed(2));

        await payslip.save();

        res.status(200).json({
            message: 'Payslip adjustments updated successfully',
            payslip
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error updating payslip' });
    }
};

// DELETE /api/admin/payslips/:id
const deletePayslip = async (req, res) => {
    try {
        const deleted = await Payslip.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Payslip not found' });
        }
        res.status(200).json({ message: 'Payslip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting payslip', error: error.message });
    }
};

// GET /api/admin/payslips/:id/pdf
const downloadPayslipPDF = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id).lean();
        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found' });
        }

        const pdfBuffer = await buildPayslipPDF(payslip);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Payslip_${payslip.employeeId}_${payslip.month}_${payslip.year}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
    }
};

// GET /api/payslips/my
const getMyPayslips = async (req, res) => {
    try {
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        if (!employeeId) {
            return res.status(200).json({ payslips: [] });
        }

        const payslips = await Payslip.find({ employee: employeeId })
            .sort({ year: -1, month: -1 })
            .lean();

        res.status(200).json({ payslips });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching your payslips', error: error.message });
    }
};

// GET /api/payslips/my/:id/pdf
const downloadMyPayslipPDF = async (req, res) => {
    try {
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        const payslip = await Payslip.findOne({ _id: req.params.id, employee: employeeId }).lean();
        
        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found' });
        }

        const pdfBuffer = await buildPayslipPDF(payslip);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Payslip_${payslip.employeeId}_${payslip.month}_${payslip.year}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
    }
};

module.exports = {
    getPayslips,
    getPayslipById,
    generatePayslip,
    generateAllPayslips,
    regeneratePayslip,
    updatePayslip,
    deletePayslip,
    downloadPayslipPDF,
    getMyPayslips,
    downloadMyPayslipPDF
};

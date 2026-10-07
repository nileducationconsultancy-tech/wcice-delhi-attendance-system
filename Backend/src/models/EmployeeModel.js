const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employeeId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    designation: { type: String, default: 'Staff' },
    role: { type: String, enum: ['EMPLOYEE', 'ADMIN', 'HR'], default: 'EMPLOYEE' },
    workSchedule: { type: String, enum: ['6_DAYS', '5_DAYS'], default: '6_DAYS' },
    baseSalary: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'PENDING'], default: 'ACTIVE' },
    profilePicture: { type: String, default: null },
    profilePictureKey: { type: String, default: null }
}, { timestamps: true });

// Indexes for high-speed queries and admin filtering
employeeSchema.index({ status: 1, role: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ name: 'text', employeeId: 'text', email: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);

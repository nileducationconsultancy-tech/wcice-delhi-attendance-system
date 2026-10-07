const mongoose = require("mongoose");
const dns = require("dns");
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}
const User = require("./src/models/UserModel");
const Employee = require("./src/models/EmployeeModel");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected");
    const employees = await Employee.find({ userId: { $exists: true } });
    for (let emp of employees) {
        if (emp.userId) {
            const user = await User.findById(emp.userId);
            if (user && !user.employeeId) {
                user.employeeId = emp._id;
                await user.save();
                console.log("Fixed user:", user.email, "linked to", emp.name);
            }
        }
    }
    console.log("Done");
    process.exit();
}).catch(console.error);

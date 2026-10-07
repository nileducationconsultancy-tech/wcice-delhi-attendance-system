const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], default: 'EMPLOYEE' },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'DISABLED'], default: 'PENDING' },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    profilePicture: { type: String, default: null },
    profilePictureKey: { type: String, default: null }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);

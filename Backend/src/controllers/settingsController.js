const Policy = require('../models/PolicyModel');

const getSettings = async (req, res) => {
    try {
        let policy = await Policy.findOne();
        if (!policy) {
            policy = await Policy.create({});
        }
        res.status(200).json(policy);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        let policy = await Policy.findOne();
        if (!policy) {
            policy = await Policy.create({});
        }

        const updatedPolicy = await Policy.findByIdAndUpdate(
            policy._id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Settings updated successfully', policy: updatedPolicy });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getSettings, updateSettings };

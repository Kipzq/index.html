const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); 

// --- DATABASE MODELS ---
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    isVerified: { type: Boolean, default: false },
    otpCode: String,
    otpExpires: Date,
    tscNo: String, memberNo: String, yearEmployed: String, yearBorn: String,
    shares: { type: Number, default: 0 },
    basicSalary: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

const LoanSchema = new mongoose.Schema({
    userId: String,
    fullName: String, accountNo: String, employer: String, station: String, payrollNo: String,
    idNo: String, address: String, phone: String, email: String, termsOfService: String,
    age: String, hasOutstandingLoan: String, outstandingAmount: String, positionInSacco: String,
    amountRequested: Number, periodMonths: Number, loanType: String, purpose: String,
    
    // 10 Guarantors
    guarantor1Name: String, guarantor1Payroll: String, guarantor1Phone: String, guarantor1Amount: Number,
    guarantor2Name: String, guarantor2Payroll: String, guarantor2Phone: String, guarantor2Amount: Number,
    guarantor3Name: String, guarantor3Payroll: String, guarantor3Phone: String, guarantor3Amount: Number,
    guarantor4Name: String, guarantor4Payroll: String, guarantor4Phone: String, guarantor4Amount: Number,
    guarantor5Name: String, guarantor5Payroll: String, guarantor5Phone: String, guarantor5Amount: Number,
    guarantor6Name: String, guarantor6Payroll: String, guarantor6Phone: String, guarantor6Amount: Number,
    guarantor7Name: String, guarantor7Payroll: String, guarantor7Phone: String, guarantor7Amount: Number,
    guarantor8Name: String, guarantor8Payroll: String, guarantor8Phone: String, guarantor8Amount: Number,
    guarantor9Name: String, guarantor9Payroll: String, guarantor9Phone: String, guarantor9Amount: Number,
    guarantor10Name: String, guarantor10Payroll: String, guarantor10Phone: String, guarantor10Amount: Number,

    applicantSignature: String, dateSigned: String,
    status: { type: String, default: 'Pending' }, 
    date: { type: Date, default: Date.now }
});
const Loan = mongoose.model('Loan', LoanSchema);

// --- FOSA MODEL ---
const FosaSchema = new mongoose.Schema({
    userId: String,
    fullName: String, idNo: String, tscNo: String, mobileNo: String,
    email: String, postalAddress: String, membershipNo: String, accountNo: String,
    amount: Number, facilityType: String, reason: String,
    guarantor1Name: String, guarantor1Tsc: String, guarantor1Amount: Number, guarantor1Mobile: String,
    guarantor2Name: String, guarantor2Tsc: String, guarantor2Amount: Number, guarantor2Mobile: String,
    applicantSignature: String, dateSigned: String,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now }
});
const Fosa = mongoose.model('Fosa', FosaSchema);

// --- APPRAISAL ROUTES ---
app.get('/api/appraise/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const basicSalary = user.basicSalary || 0;
        const netSalary = user.netSalary || 0;
        const shares = user.shares || 0;

        const oneThirdBasic = basicSalary / 3;
        const loanLimitShares = shares * 3;
        const salaryAvailable = netSalary - oneThirdBasic;
        const recommendedLoan = Math.min(loanLimitShares, 1500000);

        res.json({
            memberName: user.name, tscNo: user.tscNo, memberNo: user.memberNo,
            yearEmployed: user.yearEmployed, yearBorn: user.yearBorn,
            basicSalary, netSalary, shares, oneThirdBasic, loanLimitShares,
            salaryAvailable, recommendedLoan, amountToBoost: recommendedLoan - shares 
        });
    } catch (error) { res.status(500).json({ error: "Appraisal failed" }); }
});

// --- AUTHENTICATION ROUTES ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, tscNo, memberNo, yearEmployed, yearBorn, shares, basicSalary, netSalary } = req.body;
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith('0')) formattedPhone = '+254' + formattedPhone.substring(1);

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already exists." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({ 
            name, email, phone: formattedPhone, password: hashedPassword, 
            otpCode, otpExpires: new Date(Date.now() + 10 * 60000), isVerified: false,
            tscNo, memberNo, yearEmployed, yearBorn, 
            shares: Number(shares) || 0, basicSalary: Number(basicSalary) || 0, netSalary: Number(netSalary) || 0
        });
        await newUser.save();
        console.log(`🔑 MANUAL OTP FOR TESTING: ${otpCode}`);
        res.status(201).json({ message: "Registration successful! Check terminal for OTP." });
    } catch (error) { res.status(500).json({ error: "Registration failed." }); }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phone, code } = req.body;
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith('0')) formattedPhone = '+254' + formattedPhone.substring(1);
        const user = await User.findOne({ phone: formattedPhone });
        if (!user || user.otpCode !== code) return res.status(400).json({ error: "Invalid OTP" });
        user.isVerified = true; user.otpCode = null; await user.save();
        res.json({ message: "Verified!" });
    } catch (error) { res.status(500).json({ error: "Verification failed" }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });
        if (!user.isVerified) return res.status(400).json({ error: "Please verify your phone first." });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });
        res.json({ token, user: { name: user.name, email: user.email, phone: user.phone, id: user._id } });
    } catch (error) { res.status(500).json({ error: "Login failed" }); }
});

// --- LOAN ROUTES ---
app.get('/api/loans', async (req, res) => {
    try { const loans = await Loan.find().sort({ date: -1 }); res.json(loans); } 
    catch (error) { res.status(500).json({ error: "Failed to fetch loans" }); }
});

app.post('/api/apply-loan', async (req, res) => {
    try { const newLoan = new Loan(req.body); await newLoan.save(); res.status(201).json({ message: "Application received!" }); } 
    catch (error) { res.status(500).json({ error: "Failed to submit" }); }
});

app.put('/api/loans/:id', async (req, res) => {
    try { const updated = await Loan.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }); res.json({ success: true, loan: updated }); } 
    catch (error) { res.status(500).json({ error: "Failed to update" }); }
});

// --- FOSA ROUTES ---
app.post('/api/apply-fosa', async (req, res) => {
    try {
        const newFosa = new Fosa(req.body);
        await newFosa.save();
        res.status(201).json({ message: "FOSA Application received!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit FOSA application" });
    }
});

app.get('/api/fosa', async (req, res) => {
    try {
        const fosaList = await Fosa.find().sort({ date: -1 });
        res.json(fosaList);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch FOSA applications" });
    }
});

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI).then(() => app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))).catch((err) => console.log("❌ MongoDB connection error:", err));
import * as userService from '../services/user.service.js';
import { normalizeEmail } from '../utils/auth.util.js';
// ✅ EMPLOYEE ACCOUNT CREATION
export async function createEmployeeUser(req, res) {
    const { email, name, phone, employee_no, position, department } = req.body;

    try {
        const trimmedEmail = normalizeEmail(email);

        const userExists = await userService.checkIfUserExists(trimmedEmail);
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const userData = { email: trimmedEmail, name, phone, employee_no, position, department };
        const newUser = await userService.createEmployeeUser(userData);

        return res.status(201).json({ message: 'Employee user created successfully', data: newUser });

    } catch (error) {
        console.error('Error creating employee user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ VISITOR REGISTRATION REQUEST (SEND VERIFICATION CODE)
export async function requestVisitorRegistration(req, res) {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ message: "Email is required and must be a valid string." });
        }

        const trimmedEmail = normalizeEmail(email);
        const userExists = await userService.checkIfUserExists(trimmedEmail);
        if (userExists) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const verificationCode = await userService.generateVisitorVerificationCode(trimmedEmail);
        await userService.sendEmail(
            trimmedEmail,
            "Your Visitor Verification Code",
            `Your verification code is: ${verificationCode}`
        );

        return res.status(200).json({ message: "sent" });
    } catch (error) {
        console.error("Error sending visitor verification code:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// ✅ VISITOR VERIFICATION & ACCOUNT CREATION
export async function verifyVisitorRegistration(req, res) {
    const { email, code, name, gender, phone, password, nationality } = req.body;

    try {
        const trimmedEmail = normalizeEmail(email);

        const isValid = await userService.verifyVisitorCode(trimmedEmail, code);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        const userData = { email: trimmedEmail, name, gender, phone, password, nationality };
        const newUser = await userService.createVisitorUser(userData);

        return res.status(201).json({ message: 'successfully', data: newUser });

    } catch (error) {
        console.error('Error verifying visitor registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ EMPLOYEE REGISTRATION REQUEST - send verification code
export async function requestEmployeeRegistration(req, res) {
    const { email } = req.body;

    try {
        const trimmedEmail = normalizeEmail(email);

        const userExists = await userService.checkIfUserExists(trimmedEmail);
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const verificationCode = await userService.generateEmployeeVerificationCode(trimmedEmail);
        await userService.sendEmail(
            trimmedEmail,
            'Your Employee Verification Code',
            `Your verification code is: ${verificationCode}`
        );

        return res.status(200).json({ message: 'Verification code sent to employee email' });

    } catch (error) {
        console.error('Error sending employee verification code:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ EMPLOYEE VERIFICATION & ACCOUNT CREATION
export async function verifyEmployeeRegistration(req, res) {
    const { email, code, name, gender, phone, employee_no, position, department } = req.body;

    try {
        const trimmedEmail = normalizeEmail(email);

        const isValid = await userService.verifyEmployeeCode(trimmedEmail, code);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        const userData = { email: trimmedEmail, name, gender, phone, employee_no, position, department };
        const newUser = await userService.createEmployeeUser(userData);

        return res.status(201).json({ message: 'Employee user registered successfully', data: newUser });

    } catch (error) {
        console.error('Error verifying employee registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Get all employees
export async function getAllEmployees(req, res) {
    try {
        const employees = await userService.getAllEmployees();
        res.status(200).json({ data: employees });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Get one employee
export async function getEmployeeById(req, res) {
    const { id } = req.params;
    try {
        const employee = await userService.getEmployeeById(id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.status(200).json({ data: employee });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Update employee
export async function updateEmployee(req, res) {
    const { id } = req.params;
    const data = req.body;
    try {
        await userService.updateEmployee(id, data);
        res.status(200).json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Delete employee
export async function deleteEmployee(req, res) {
    const id = req.params.id;
    try {
        const deleted = await userService.deleteEmployee(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Get all visitors
export async function getAllVisitors(req, res) {
    try {
        const visitors = await userService.getAllVisitors();
        res.status(200).json({ data: visitors });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Get one visitor
export async function getVisitorById(req, res) {
    const id = req.params.id;
    try {
        const visitor = await userService.getVisitorById(id);
        if (!visitor) {
            return res.status(404).json({ message: 'Visitor not found' });
        }
        res.status(200).json({ data: visitor });
    } catch (error) {
        console.error('Error fetching visitor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Update visitor
export async function updateVisitor(req, res) {
    const id = req.params.id;
    const { name, phone, nationality } = req.body;
    const email = normalizeEmail(req.body.email);

    try {
        const updatedVisitor = await userService.updateVisitor(id, { name, email, phone, nationality });
        res.status(200).json({ message: 'Visitor updated successfully', data: updatedVisitor });
    } catch (err) {
        console.error('Error updating visitor:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ✅ Delete visitor
export async function deleteVisitor(req, res) {
    const id = req.params.id;
    try {
        const deleted = await userService.deleteVisitor(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Visitor not found' });
        }
        res.status(200).json({ message: 'Visitor deleted successfully' });
    } catch (error) {
        console.error('Error deleting visitor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


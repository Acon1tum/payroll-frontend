

## 👤 User Roles

### **Admin / Payroll Manager**

* Manage employee records (salary, attendance, benefits, deductions).
* Compute payroll (basic salary, allowances, deductions).
* Ensure statutory compliance (SSS, PhilHealth, Pag-IBIG, withholding tax).
* Generate payslips, reports, and remittances.

### **Employee**

* View payslip, attendance, and leave records.
* Update personal and government IDs for payroll accuracy.
* Request corrections/clarifications on pay.

---

## 🔄 End-to-End Payroll Workflow (Task Breakdown)

### 1. **Pre-Payroll Setup**

* [ ] Collect employee master data:

  * Full name, TIN, SSS, PhilHealth, Pag-IBIG numbers.
  * Salary type (monthly, daily, hourly).
  * Employment status (regular, probationary, contractual).
* [ ] Define pay schedule (e.g., semi-monthly: 15th and 30th).
* [ ] Set up statutory contribution tables (SSS, PhilHealth, Pag-IBIG).
* [ ] Load BIR withholding tax tables.

---

### 2. **Timekeeping & Attendance**

* **Employee**

  * [ ] Log time in/out daily (biometric, timesheet, app).
  * [ ] File leaves and overtime requests.
* **Admin**

  * [ ] Validate attendance, overtime, and leave.
  * [ ] Approve or reject adjustments.

---

### 3. **Gross Pay Calculation**

* [ ] Compute **Basic Salary**:

  ```
  Monthly Rate ÷ Workdays × Actual Days Worked
  ```
* [ ] Add Allowances (transport, meal, COLA, etc.).
* [ ] Add Overtime Pay, Holiday Pay, Night Differential (if applicable).

---

### 4. **Deductions (Philippines Compliance)**

#### Statutory Contributions (Employee + Employer)

* [ ] **SSS**

  * Employee share deducted from salary (4.5%).
  * Employer contributes separately (up to \~9.5%).
  * Based on SSS salary bracket.
* [ ] **PhilHealth**

  * 5% of monthly salary.
  * Split 50/50 (2.5% employee, 2.5% employer).
  * Subject to minimum/maximum contribution cap.
* [ ] **Pag-IBIG (HDMF)**

  * Employee: usually ₱100.
  * Employer: ₱100 (unless higher contribution chosen).
* [ ] **Withholding Tax (TRAIN Law)**

  * Based on **taxable income after mandatory deductions**.
  * Follow BIR’s withholding tax tables.

#### Other Deductions

* [ ] Loans or cash advances.
* [ ] Insurance premiums.
* [ ] Deductions for absences.

---

### 5. **Net Pay Computation**

```text
Net Pay = Gross Pay – (SSS + PhilHealth + Pag-IBIG + Withholding Tax + Other Deductions)
```

---

### 6. **Payroll Review & Approval**

* [ ] Review payroll computation (system-generated).
* [ ] Secure management approval (if required).
* [ ] Generate payroll register for finance/HR.

---

### 7. **Payout**

* **Admin**

  * [ ] Schedule payout via bank transfer, payroll account, or cash.
  * [ ] Issue payslips (digital or printed), showing:

    * Basic salary, allowances, OT.
    * Deductions (SSS, PhilHealth, Pag-IBIG, Tax).
    * Net pay.
* **Employee**

  * [ ] Receive salary and verify payslip breakdown.

---

### 8. **Government Remittances & Reporting**

* [ ] **SSS**: Submit R-5 Payment Return + remit via bank/electronic.
* [ ] **PhilHealth**: Submit RF-1 & remit contributions.
* [ ] **Pag-IBIG**: Submit M1-1 & remit contributions.
* [ ] **BIR**:

  * File monthly withholding tax return (BIR Form 1601C).
  * Submit quarterly Alphalist.
  * Issue annual employee tax form (BIR Form 2316).
* [ ] Maintain compliance reports for audit.

---

### 9. **Year-End & Clearance**

* [ ] Release **13th Month Pay** (due every December).
* [ ] Perform **Year-End Tax Adjustment**.
* [ ] Provide **BIR Form 2316** to employees.
* [ ] Handle employee clearance on resignation/termination.

---

## 📊 Payroll Workflow Diagram (Text-Based)

```mermaid
flowchart TD
    A[Employee Timekeeping] --> B[Admin Validates Attendance]
    B --> C[Gross Pay Computation]
    C --> D[Govt. Contributions & Tax Deductions]
    D --> E[Net Pay Computation]
    E --> F[Payroll Review & Approval]
    F --> G[Salary Disbursement (Bank/Cash)]
    G --> H[Payslip Issuance]
    H --> I[Govt. Remittances & Reporting]
    I --> J[Year-End Processing & Clearance]
```



# 📌 Payroll Example — ₱25,000 Monthly Salary

## 1. **Basic Pay**

* Monthly Rate = ₱25,000
* Semi-monthly (2 payouts) = ₱25,000 ÷ 2 = **₱12,500 per cutoff**

---

## 2. **Statutory Contributions**

### (a) **SSS Contribution**

* SSS table (2025): ₱25,000 falls in the higher salary bracket.
* Total contribution rate = 14% (9.5% employer, 4.5% employee).
* Employee share ≈ **₱1,125**
* Employer share ≈ ₱2,375 *(not deducted from employee pay, but must be remitted by employer)*

---

### (b) **PhilHealth Contribution**

* 2025 premium rate: **5% of monthly salary** (split 50/50).
* Monthly premium = ₱25,000 × 5% = ₱1,250
* Employee share = **₱625**
* Employer share = ₱625

---

### (c) **Pag-IBIG Contribution**

* Standard rate: ₱100 employee + ₱100 employer.
* Employee share = **₱100**

---

## 3. **Withholding Tax (TRAIN Law)**

Taxable Income = **₱25,000 – (₱1,125 + ₱625 + ₱100)** = **₱23,150**

Based on TRAIN Law monthly withholding tax table:

* ₱20,833 – ₱33,332 bracket → Tax = 20% of excess over ₱20,833
* Excess = ₱23,150 – ₱20,833 = ₱2,317
* Tax = ₱2,317 × 20% = **₱463.40** (≈ ₱463)

---

## 4. **Net Pay Computation**

**Monthly Computation**

```
Gross Pay:        ₱25,000.00
Less:
  SSS (EE):       ₱1,125.00
  PhilHealth (EE):₱625.00
  Pag-IBIG (EE):  ₱100.00
  Withholding Tax:₱463.40
----------------------------
Net Pay:          ₱22,686.60
```

**Semi-Monthly (per cutoff)**

```
Gross: ₱12,500.00
Deductions (half of monthly):
  SSS: ₱562.50
  PhilHealth: ₱312.50
  Pag-IBIG: ₱50.00
  Tax: ₱231.70
----------------------------
Net: ₱11,343.30
```

---

# ✅ Final Summary (₱25,000 Salary)

* **Gross Pay:** ₱25,000
* **Total Employee Deductions:** ₱2,313.40
* **Net Take-Home Pay:** ₱22,686.60

Employer’s additional cost (not deducted from employee):

* SSS = ₱2,375
* PhilHealth = ₱625
* Pag-IBIG = ₱100
* **Total Employer Share = ₱3,100**

---



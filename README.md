# Secure Salary Dashboard (JS + Express)

## **Project Overview**

The **Secure Salary Dashboard** is a web application for uploading, encrypting, and analyzing salary datasets. The system securely encrypts sensitive data using **AES-256 encryption**, allowing you to safely store and visualize salary information without exposing raw data.

This project was built using **Node.js, Express, and plain JavaScript**, with interactive charts powered by **Chart.js**.

### Project Structure

```bash
secure-salary-dashboard/
├── data
│   └── Global Deep Dive: AI, ML, & Data Science Salaries.csv  # Sample dataset
├── package.json
├── package-lock.json
├── public
│   ├── index.html    # Frontend HTML
│   ├── script.js     # Frontend JS (upload, encrypt, decrypt, dashboard)
│   └── style.css     # Frontend styling
├── server.js         # Express backend
└── upload            # Temporary folder for uploaded files
```

## **Features**

1. **CSV Upload**
   
   - Upload salary datasets (`.csv`) via a simple interface.
   
   - Automatically parses the CSV headers and rows.
   
   - I use salary dataset

2. **AES-256 Encryption**
   
   - Encrypts sensitive fields: `salary`, `salary_in_usd`, `job_title`.
   
   - User-provided key ensures security.

3. **Decryption & Dashboard**
   
   - Decrypt data using the encryption key.
   
   - Visualize metrics with charts:
     
     - Salary by Job Title (Bar Chart)
     
     - Total Records
     
     - Average Salary

4. **Interactive Notifications**
   
   - Shows success/error messages for each action (upload, encrypt, decrypt).

## **Installation**

1. **Clone the repository**
   
   ```bash
   git clone
   cd secure-salary-dashboard
   ```

2. **Install dependencies**
   
   ```bash
   npm install
   ```

3. **Run the server***
   
   ```bash
   npm start
   ```

4. **Open the app in your browser**

```bash
http://localhost:3000/
```

## **Usage**

### **1. Upload CSV**

- Go to the **Upload CSV** section.

- Select a `.csv` file (e.g., `Global Deep Dive: AI, ML, & Data Science Salaries.csv`).

- Click **Upload**.

- Notification will show how many records were loaded.

### **2. Encrypt Data**

- Enter a **secure AES-256 key** in the encryption input box.

- Click **Encrypt Data**.

- Data is now encrypted and ready for secure storage.

### **3. Decrypt Data & View Dashboard**

- Enter the **same encryption key** used before.

- Click **Decrypt & Load**.

- Dashboard displays:
  
  - Total Records
  
  - Average Salary
  
  - Salary per Job Title chart

---

## **Encryption Details**

- **Algorithm**: AES-256-GCM

- **Fields encrypted**:
  
  - `salary`
  
  - `salary_in_usd`
  
  - `job_title`

- **Key management**: Users must securely save the key to decrypt the data later.

---

## **Dependencies**

- **Node.js** (>=14.x)

- **Express**

- **express-fileupload**

- **csv-parser**

- **Chart.js** (via CDN)

---

## **Video View**



https://github.com/user-attachments/assets/46d69b0c-edb3-4f9f-8121-1065e1684eb2



---

## **Future Improvements**

- Add charts for:
  
  - Average salary by company size
  
  - Count by experience level
  
  - Remote work distribution

- Export encrypted CSV

- User authentication for multiple users

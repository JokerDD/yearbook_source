# Excel Student Upload Guide

## Overview
The Student Management section now supports both CSV and Excel (.xlsx) file uploads for bulk adding students to the yearbook system.

## Supported Upload Formats

### 1. CSV Format (Paste Text)
Enter student data directly in the text area:
```
John Doe,john@college.edu,+1-555-0001
Jane Smith,jane@college.edu,+1-555-0002
Mike Johnson,mike@college.edu
```

**Format:** Name, Email, Phone (optional)

### 2. Excel File (.xlsx)
Upload an Excel spreadsheet with the following requirements:

#### Required Columns:
- **Name** - Student full name
- **Email** - Student email address

#### Optional Columns:
- **Phone** - Student phone number

#### Example Excel Structure:
| Name | Email | Phone |
|------|-------|-------|
| John Doe | john@college.edu | +1-555-0001 |
| Jane Smith | jane@college.edu | +1-555-0002 |
| Mike Johnson | mike@college.edu | |

## How to Use

### Step 1: Navigate to Student Management
- Go to Admin Dashboard
- Click on "Students" tab
- Click "Upload Students" button

### Step 2: Select College
- Choose the college from the dropdown

### Step 3: Choose Upload Format
- **CSV:** Paste data directly in the text area
- **Excel:** Click to select a .xlsx file

### Step 4: Upload
- Click "Upload Students"
- System will validate the data
- Invalid rows (missing name or email) are skipped
- Valid students are created in the system

### Step 5: Save Credentials
- Generated credentials (username, email, password) will be displayed
- Download or copy credentials to share with students

## Validation Rules

✅ **Required:**
- Student Name (not empty)
- Email Address (valid format)

✅ **Optional:**
- Phone Number (can be left blank)

❌ **Will be skipped:**
- Rows with missing name or email
- Duplicate email addresses (if already registered)

## Tips

1. **Excel File Tips:**
   - Use .xlsx format (not .xls or .csv)
   - Column headers must match exactly (Name, Email, Phone)
   - Keep data clean - trim extra spaces

2. **Bulk Upload Tips:**
   - Upload to only ONE college at a time
   - Review data for accuracy before uploading
   - Save generated credentials immediately

3. **Error Handling:**
   - Check for duplicate emails
   - Verify email format (name@domain.com)
   - Ensure name field is not empty

## Example Files

### Sample CSV Format:
```
Alice Brown,alice@college.edu,+1-555-1111
Bob Wilson,bob@college.edu,
Charlie Davis,charlie@college.edu,+1-555-1113
```

### Sample Excel File:
Create an Excel file with these columns:
- Column A: Name
- Column B: Email  
- Column C: Phone (optional)

Then save as `.xlsx` and upload!

## Troubleshooting

**"Excel file not accepted"**
- Make sure file is .xlsx format
- Try re-saving the file in Excel

**"No valid students found"**
- Check that at least Name and Email columns exist
- Verify no rows are completely empty
- Ensure column headers match exactly

**"Upload failed"**
- Check internet connection
- Verify college is selected
- Check for duplicate emails in the file

---

**Need help?** Check the main README.md for more information about the yearbook application.

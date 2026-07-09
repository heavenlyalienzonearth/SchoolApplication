import openpyxl
import os

def create_excel():
    wb = openpyxl.Workbook()
    sheet = wb.active
    sheet.title = "Vaccinations"
    
    # Headers
    sheet.append(["Name", "Age Group"])
    
    # Rows
    rows = [
        ["BCG (Tuberculosis)", "Toddler Explorers (Robo-Tots)"],
        ["Hepatitis B (HepB)", "Toddler Explorers (Robo-Tots)"],
        ["OPV / IPV (Polio)", "Preschool Engineers (Junior Coders)"],
        ["Varicella (Chickenpox)", "Preschool Engineers (Junior Coders)"],
        ["MMR (Measles, Mumps, Rubella)", "Kindergarten Innovators (Future Designers)"],
        ["DTaP Booster", "Kindergarten Innovators (Future Designers)"],
        ["Rotavirus (RV)", "Toddler Explorers (Robo-Tots)"],
        ["Pneumococcal (PCV)", "Toddler Explorers (Robo-Tots)"],
        ["Hib Vaccine", "Preschool Engineers (Junior Coders)"],
        ["Hepatitis A (HepA)", "Preschool Engineers (Junior Coders)"]
    ]
    
    for r in rows:
        sheet.append(r)
        
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    os.makedirs(static_dir, exist_ok=True)
    
    file_path = os.path.join(static_dir, "sample_vaccinations.xlsx")
    wb.save(file_path)
    print(f"Created sample vaccinations excel file at: {file_path}")

if __name__ == "__main__":
    create_excel()

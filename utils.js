// Date Calculation Logic - Perfected for Rentals
function calculateRentDays(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Time ko ignore karke sirf dates compare karna
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Rule: Same day return par bhi 1 din ka rent charge hoga
    return diffDays > 0 ? diffDays : 1; 
}
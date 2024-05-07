import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';

function Reports({ db }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const querySnapshot = await getDocs(reportsRef);
        const reportsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [db]);

  // Function to format the timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate();
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleString('en-US', options);
  };

  return (
    <div>
      <h2 className="pageTitle">Reports</h2>
      <p style={{ margin: '0' }}>{reports.length} reports found</p>
      <table className="custom-table">
        <thead>
          <tr>
            <th>Date Reported</th>
            <th>Email</th>
            <th>Exposure Date</th>  
            <th>Tested Positive</th>
            <th>Experiencing Symptoms</th>
            <th>In Quarantine</th>
            <th>Medical Assistance Needed</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{formatTimestamp(report.timestamp)}</td>              
              <td>{report.email}</td>
              <td>{report.exposureDate}</td>
              <td>{report.testedPositive ? 'Yes' : 'No'}</td>
              <td>{report.experiencingSymptoms ? 'Yes' : 'No'}</td>
              <td>{report.inQuarantine ? 'Yes' : 'No'}</td>
              <td>{report.medicalAssistanceNeeded ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;

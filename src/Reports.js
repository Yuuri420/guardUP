import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';

function Reports({ db }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('timestamp', 'desc')); // Order by timestamp in descending order
        const querySnapshot = await getDocs(q);
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

  const handleScanPossibleContacts = async (buildingCode, exposureDate) => {
    try {
      const startDate = new Date(exposureDate);
      const endDate = new Date(exposureDate);
      endDate.setDate(endDate.getDate() + 7);

      const entriesRef = collection(db, 'entries');
      const q = query(
        entriesRef,
        where('buildingCode', '==', buildingCode),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      const possibleContacts = querySnapshot.docs.map((doc) => doc.data().userEmail);
      console.log('Possible Contacts:', possibleContacts);
    } catch (error) {
      console.error('Error scanning possible contacts:', error);
    }
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
            <th>Actions</th> {/* Added a new column for Actions */}
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
              <td>
                <button
                  style={{
                    backgroundColor: '#991232',
                    color: 'white',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleScanPossibleContacts(report.buildingCode, report.exposureDate)}
                >
                  Scan Possible Contacts
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;

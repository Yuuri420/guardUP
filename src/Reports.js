import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';

Modal.setAppElement('#root'); // Set the app element for accessibility

function Reports({ db }) {
  const [reports, setReports] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalData, setModalData] = useState([]);

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

  const handleScanPossibleContacts = async (report) => {
    try {
      const { email, exposureDate } = report;
      console.log('Reporter Email:', email); // Debug: log reporter email
      console.log('Exposure Date:', exposureDate); // Debug: log exposure date

      if (!email || !exposureDate) {
        throw new Error('Invalid email or exposureDate');
      }

      const exposureDateTime = new Date(exposureDate); // set time to 23:59:59
      const startDate = new Date(exposureDateTime);
      startDate.setDate(startDate.getDate() - 7);
      exposureDateTime.setHours(23,59,59);

      // Step 1: Find all buildings the reporter visited in the past 3 days
      const entriesRef = collection(db, 'entries');
      console.log("start date, exposure date,, ", startDate, exposureDateTime);
      const reporterEntriesQuery = query(
        entriesRef,
        where('userEmail', '==', email),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(exposureDateTime))
      );

      const reporterEntriesSnapshot = await getDocs(reporterEntriesQuery);
      const buildingsVisited = new Set(
        reporterEntriesSnapshot.docs.map((doc) => doc.data().buildingCode)
      );

      console.log('Buildings Visited:', buildingsVisited); // Debug: log buildings visited

      // Step 2: Find all users who visited the same buildings in the same timeframe
      const possibleContacts = [];

      for (let building of buildingsVisited) {
        const contactsQuery = query(
          entriesRef,
          where('buildingCode', '==', building)
        );

        const contactsSnapshot = await getDocs(contactsQuery);
        contactsSnapshot.forEach((doc) => {
          const data = doc.data();
          const entryTimestamp = data.timestamp.toDate();
          const dateaaa = entryTimestamp.toLocaleString();

          console.log(entryTimestamp);
          if (
            data.userEmail !== email &&
            entryTimestamp >= startDate &&
            entryTimestamp <= exposureDateTime
          ) {
            possibleContacts.push({
              userEmail: data.userEmail,
              building: data.buildingCode,
              entryTime: data.entryTime,
              timestamp: dateaaa,
              exitTimestamp: data.exitTimestamp,
            });
          }
        });
      }

      console.log('Possible Contacts:', possibleContacts); // Debug: log the possible contacts

      // Set the data and open the modal
      setModalData(possibleContacts);
      setModalIsOpen(true);
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
                  onClick={() => handleScanPossibleContacts(report)}
                >
                  Scan Possible Contacts
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Possible Contacts"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
          },
        }}
      >
        <h2>Possible Contacts</h2>
        <button onClick={() => setModalIsOpen(false)} style={{ float: 'right' }}>Close</button>
        <ul>
          {modalData.length > 0 ? (
            modalData.map((data, index) => (
              <li key={index}>
                User: {data.userEmail}, Building: {data.building}, Entry Time: {data.timestamp}
              </li>
            ))
          ) : (
            <li>No possible contacts found.</li>
          )}
        </ul>
      </Modal>
    </div>
  );
}

export default Reports;

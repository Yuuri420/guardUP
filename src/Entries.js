import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { PDFDownloadLink, Page, Text, Document, StyleSheet, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: 1,
    paddingBottom: 5,
    marginBottom: 10,
  },
  tableHeaderColumn: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRowColumn: {
    flex: 1,
    fontSize: 12,
  },
});


function formatTimestamp(timestamp) {
  const date = new Date(timestamp.seconds * 1000);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[date.getMonth()];

  const hours = date.getHours() % 12 || 12;
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const amPm = date.getHours() >= 12 ? 'PM' : 'AM';

  return `${month} ${date.getDate()}, ${date.getFullYear()} at ${hours}:${minutes} ${amPm}`;
}

function PDFReport({ entries }) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>Logs History</Text>
        <View style={styles.tableHeader}>
          <View style={styles.tableHeaderColumn}>
            <Text>User Email</Text>
          </View>
          <View style={styles.tableHeaderColumn}>
            <Text>Building</Text>
          </View>
          <View style={styles.tableHeaderColumn}>
            <Text>Timestamp</Text>
          </View>
        </View>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.tableRow}>
            <View style={styles.tableRowColumn}>
              <Text>{entry.userEmail}</Text>
            </View>
            <View style={styles.tableRowColumn}>
              <Text>{entry.buildingCode}</Text>
            </View>
            <View style={styles.tableRowColumn}>
              <Text>{formatTimestamp(entry.timestamp)}</Text>
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}


// ... (Same imports and styles)

function Entries({ db }) {
  const [entries, setEntries] = useState([]);
  const [buildingCodeFilter, setBuildingCodeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [userEmailFilter, setUserEmailFilter] = useState('');

  // ... (formatTimestamp function and PDFReport component)

  // Function to fetch entries based on the current filters
  const fetchEntries = async () => {
    try {
      const entriesRef = collection(db, 'entries');
      let filteredQuery = query(entriesRef, orderBy('timestamp', 'desc'));

      if (buildingCodeFilter !== '') {
        filteredQuery = query(filteredQuery, where('buildingCode', '==', buildingCodeFilter), orderBy("timestamp", "desc"));
      }

      if (startDateFilter !== '') {
        const startDate = new Date(startDateFilter);
        startDate.setHours(0, 0, 0, 0);
        filteredQuery = query(filteredQuery, where('timestamp', '>=', startDate), orderBy("timestamp", "desc"));
      }

      if (endDateFilter !== '') {
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999);
        filteredQuery = query(filteredQuery, where('timestamp', '<=', endDate), orderBy("timestamp", "desc"));
      } else {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        filteredQuery = query(filteredQuery, where('timestamp', '>=', startDate), orderBy("timestamp", "desc"));
      }

      if (userEmailFilter !== '') {
        filteredQuery = query(filteredQuery, where('userEmail', '==', userEmailFilter), orderBy("timestamp", "desc"));
      }

      const querySnapshot = await getDocs(filteredQuery);
      const entriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(entriesData);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [db, buildingCodeFilter, startDateFilter, endDateFilter, userEmailFilter]);


  useEffect(() => {
    if (userEmailFilter !== '') {
      const fetchEntriesByUserEmail = async () => {
        try {
          const entriesRef = collection(db, 'entries');
          const filteredQuery = query(entriesRef, where('userEmail', '==', userEmailFilter));
          const querySnapshot = await getDocs(filteredQuery);
          const entriesData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEntries(entriesData);
        } catch (error) {
          console.error('Error fetching entries:', error);
        }
      };

      fetchEntriesByUserEmail();
    } else {
      fetchEntries();
    }
  }, [db, userEmailFilter]);

  const allBuildingCodes = [...new Set(entries.map((entry) => entry.buildingCode))];
  const allUserEmails = [...new Set(entries.map((entry) => entry.userEmail))];

  return (
    <div>
      <h2 className="pageTitle">Logs</h2>
      <p style={{ marginTop: '0' }}>{entries.length} logs found</p>
      <div>
        <label>
          Building:
          <select value={buildingCodeFilter} onChange={(e) => setBuildingCodeFilter(e.target.value)}>
            <option value="">All</option>
            {allBuildingCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start Date:
          <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
        </label>
        <label>
          User Email:
          <select value={userEmailFilter} onChange={(e) => setUserEmailFilter(e.target.value)}>
            <option value="">All</option>
            {allUserEmails.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </label>
        <button onClick={fetchEntries}>Apply Filters</button>
        <PDFDownloadLink document={<PDFReport entries={entries} />} fileName="entries.pdf">
        {({ loading }) => (
          <button
            style={{
              backgroundColor: '#991232',
              color: 'white',
              borderRadius: '10px',
              padding: '5px 10px',
              border: 'none',
              cursor: 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Export to PDF'}
          </button>
        )}
      </PDFDownloadLink>
      </div>
      <table className="custom-table">
        <thead>
          <tr>
            <th>User Email</th>
            <th>Building</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.userEmail}</td>
              <td>{entry.buildingCode}</td>
              <td>{formatTimestamp(entry.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Entries;

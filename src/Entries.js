import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, startAfter, startAt } from 'firebase/firestore';
import { Table, Form, Pagination } from 'react-bootstrap';

function Entries({ db }) {
  const [entries, setEntries] = useState([]);
  const [buildingCodeFilter, setBuildingCodeFilter] = useState('');
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [pageLimit, setPageLimit] = useState(25);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
  const [isPrevPageAvailable, setIsPrevPageAvailable] = useState(false);
  const [prevPagesStack, setPrevPagesStack] = useState([]);

  useEffect(() => {
    fetchEntries();
  }, [buildingCodeFilter, userEmailFilter, pageLimit]);

  const fetchEntries = async (startAfterDoc = null, startAtDoc = null, stackUpdate = true) => {
    try {
      let entriesRef = collection(db, 'entries');
      let q = query(entriesRef, orderBy('timestamp', 'desc'));

      if (buildingCodeFilter) {
        q = query(q, where('buildingCode', '>=', buildingCodeFilter), where('buildingCode', '<=', buildingCodeFilter + '\uf8ff'));
      }

      if (userEmailFilter) {
        q = query(q, where('userEmail', '>=', userEmailFilter), where('userEmail', '<=', userEmailFilter + '\uf8ff'));
      }

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      if (startAtDoc) {
        q = query(q, startAt(startAtDoc));
      }

      q = query(q, limit(pageLimit));

      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (stackUpdate) {
        setPrevPagesStack((prev) => [...prev, firstVisible]);
      }

      setEntries(entriesData);
      setFirstVisible(querySnapshot.docs[0]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setIsNextPageAvailable(querySnapshot.docs.length === pageLimit);
      setIsPrevPageAvailable(startAfterDoc !== null);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleBuildingCodeFilterChange = (e) => {
    setBuildingCodeFilter(e.target.value);
  };

  const handleUserEmailFilterChange = (e) => {
    setUserEmailFilter(e.target.value);
  };

  const handleNextPage = () => {
    fetchEntries(lastVisible);
  };

  const handlePrevPage = () => {
    const previousPage = prevPagesStack[prevPagesStack.length - 1];
    setPrevPagesStack((prev) => prev.slice(0, prev.length - 1));
    fetchEntries(null, previousPage, false);
  };

  return (
    <div>
      <h2 className="pageTitle">Entries</h2>
      <Form>
        <Form.Group controlId="buildingCodeFilter">
          <Form.Label>Building Code Filter</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter building code"
            value={buildingCodeFilter}
            onChange={handleBuildingCodeFilterChange}
          />
        </Form.Group>
        <Form.Group controlId="userEmailFilter">
          <Form.Label>User Email Filter</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter user email"
            value={userEmailFilter}
            onChange={handleUserEmailFilterChange}
          />
        </Form.Group>
      </Form>
      <Table striped bordered hover className="custom-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Building Code</th>
            <th>User Email</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{new Date(entry.timestamp.toDate()).toLocaleString()}</td>
              <td>{entry.buildingCode}</td>
              <td>{entry.userEmail}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="d-flex justify-content-center">
        <Pagination>
          <Pagination.Prev onClick={handlePrevPage} disabled={!isPrevPageAvailable} />
          <Pagination.Next onClick={handleNextPage} disabled={!isNextPageAvailable} />
        </Pagination>
      </div>
    </div>
  );
}

export default Entries;

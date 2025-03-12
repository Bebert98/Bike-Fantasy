import React from 'react';

const Table = ({ data = [], columns }) => {
    return (
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

export default Table;

/* 

Usage :

const columns = ["Name", "Age", "City"];
const data = [
    { Name: "John Doe", Age: 28, City: "New York" },
    { Name: "Jane Doe", Age: 32, City: "Los Angeles" },
    { Name: "Sam Smith", Age: 22, City: "Chicago" }
  ];
  
 <Table columns={columns} data={data} /> 
 
 */
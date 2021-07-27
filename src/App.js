import React, { useState, useEffect, useStyles } from "react";
import fetch from './api/dataService';
import "./App.css";
import _ from 'lodash';
import ReactTable from "react-table";  
import "react-table/react-table.css";  




function calculateRewardPoints(userData) {
  // Calculate points per transaction

  const yearCalendar = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const rewardPointsPerTx = userData.map(tx=> {
    let points = 0;
    let over100 = tx.amount - 100;
    
    if (over100 > 0) {
      // A customer receives 2 points for every dollar spent over $100 in each tx      
      points += (over100 * 2);
    }    
    if (tx.amount > 50) {
      // plus 1 point for every dollar spent over $50 in each tx
      points += 50;      
    }
    const month = new Date(tx.txDate).getMonth();
    return {...tx, points, month};
  });
               
  let eachCust = {};
  let totalPtnsOfEachCust = {};
  rewardPointsPerTx.forEach(pointsPerTransaction => {
    let {customerId, customerName, month, points} = pointsPerTransaction;   
    if (!eachCust[customerId]) {
      eachCust[customerId] = [];      
    }    
    if (!totalPtnsOfEachCust[customerId]) {
      totalPtnsOfEachCust[customerName] = 0;
    }
    totalPtnsOfEachCust[customerName] += points;
    if (eachCust[customerId][month]) {
      eachCust[customerId][month].points += points;
      eachCust[customerId][month].monthNumber = month;
      eachCust[customerId][month].numTransactions++;      
    }
    else {
      
      eachCust[customerId][month] = {
        customerId,
        customerName,
        monthNumber:month,
        month: yearCalendar[month],
        numTransactions: 1,        
        points
      }
    }    
  });
  let total = [];
  for (var cust in eachCust) {    
    eachCust[cust].forEach(cRow=> {
      total.push(cRow);
    });    
  }
  let totByCustomer = [];
  for (cust in totalPtnsOfEachCust) {    
    totByCustomer.push({
      customerName: cust,
      points: totalPtnsOfEachCust[cust]
    });    
  }
  return {
    summaryByCustomer: total,
    pointsPerTransaction: rewardPointsPerTx,
    totalPointsByCustomer:totByCustomer
  };
}

function App() {
  const [customerTxData, setCustTxData] = useState(null);
  
  const columns = [
    {
      Header:'Name of the Customer',
      accessor: 'customerName'      
    },    
    {
      Header:'Month',
      accessor: 'month'
    },
    {
      Header: "No. of Transactions",
      accessor: 'numTransactions'
    },
    {
      Header:'Reward Points',
      accessor: 'points'
    }
  ];
  const totalsByColumns = [
    {
      Header:'Name of the Customer',
      accessor: 'customerName'      
    },    
    {
      Header:'Total Reward Points',
      accessor: 'points'
    }
  ]

  function getCustTransaction(row) {
    let byCustMonth = _.filter(customerTxData.pointsPerTransaction, (tRow)=>{    
      return row.original.customerId === tRow.customerId && row.original.monthNumber === tRow.month;
    });
    return byCustMonth;
  }

  useEffect(() => { 
    fetch().then((data)=> {             
      const results = calculateRewardPoints(data);      
      setCustTxData(results);
    });
  },[]);

  if (customerTxData == null) {
    return <div>Transactions are loading...</div>;   
  }

  return customerTxData == null ?
    <div>Transactions are loading...</div> 
      :    
    <div>      
      
      <div className="container">
        <div className="row">
          <div className="col-10">
            <h2>Total Reward Points Of Each Customer By Month</h2>
          </div>
        </div>
        <div className="row">
          <div className="col-8">
            <ReactTable
              data={customerTxData.summaryByCustomer}
              defaultPageSize={5}
              columns={columns}
              SubComponent={row => {
                return (
                  <div>
                    
                      {getCustTransaction(row).map(tran=>{
                        return <div className="container">
                          <div className="row">
                            <div className="col-8">
                              <strong>Transaction Date:</strong> {tran.txDate} - <strong>$</strong>{tran.amount} - <strong>Points: </strong>{tran.points}
                            </div>
                          </div>
                        </div>
                      })}                                    

                  </div>
                )
              }}
              />             
            </div>
          </div>
        </div>
        
        <div className="container">    
          <div className="row">
            <div className="col-10">
              <h2>Total Reward Points of Each Customer</h2>
            </div>
          </div>      
          <div className="row">
            <div className="col-8">
              <ReactTable
                data={customerTxData.totalPointsByCustomer}
                columns={totalsByColumns}
                defaultPageSize={5}                
              />
            </div>
          </div>
        </div>      
    </div>
  ;
}

export default App;

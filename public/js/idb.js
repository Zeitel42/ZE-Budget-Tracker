let db;
const request = indexedDB.open("pending_budget", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run budgetD() function to send all local db data to api
  if (navigator.onLine) {
    budgetDb();
  }
};

request.onerror = function (event) {
  //log error
  console.log("OMG, Error.", event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget item and there's no internet connection

function saveRecord(record) {
  //open a new transaction with the db with r & w permissions
  const transaction = db.transaction(["new_pending"], "readwrite");
  //access the object store for 'budgetPending'
  const budgetPendingObjectStore = transaction.objectStore("new_pending");
  // add record to your store with add method
  budgetPendingObjectStore.add(record);
}

function budgetDb() {
  // open a transaction on your db
  const transaction = db.transaction(["new_pending"], "readwrite");

  // access your object store
  const budgetPendingObjectStore = transaction.objectStore("new_pending");

  // get all records from store and set to a variable
  const getAll = budgetPendingObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_pending"], "readwrite");
          // access the budgetPending object store
          const budgetPendingObjectStore =
            transaction.objectStore("new_pending");
          // clear all items in your store
          budgetPendingObjectStore.clear();

          alert("All saved budgetPending has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", budgetDb);

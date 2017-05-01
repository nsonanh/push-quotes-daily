// create a reference to the notifications list in the bottom of the app; we will write database messages into this list by
//appending list items on to the inner HTML of this variable - this is all the lines that say console.log('<li>foo</li>';
var note = document.getElementById('notifications');

// create an instance of a db object for us to store the IDB data in
var db;

// create a blank instance of the object that is used to transfer data into the IDB. This is mainly for reference
var newItem = [
      { key: 0, hours: 0, minutes: 0, notified: "no" }
    ];

// all the variables we need for the app
var key = 1;
var taskForm = document.getElementById('taskForm');
var time = document.getElementById('time');

var submit = document.getElementById('submit');

window.onload = function() {
  console.log("App initialised.");
  // In the following line, you should include the prefixes of implementations you want to test.
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  // DON'T use "var indexedDB = ..." if you're not in a function.
  // Moreover, you may need references to some window.IDB* objects:
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
  // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)


  // Let us open our database
  var DBOpenRequest = window.indexedDB.open("taskList", 4);
   
  // Gecko-only IndexedDB temp storage option:
  // var request = window.indexedDB.open("taskList", {version: 4, storage: "temporary"});

  // these two event handlers act on the database being opened successfully, or not
  DBOpenRequest.onerror = function(event) {
    console.log("Error loading database.");
  };
  
  DBOpenRequest.onsuccess = function(event) {
    console.log("Database initialised.");
    
    // store the result of opening the database in the db variable. This is used a lot below
    db = DBOpenRequest.result;
    
    // Run the displayData() function to populate the task list with all the to-do list data already in the IDB
    // deleteData();
  };
  
  // This event handles the event whereby a new version of the database needs to be created
  // Either one has not been created before, or a new version number has been submitted via the
  // window.indexedDB.open line above
  //it is only implemented in recent browsers
  DBOpenRequest.onupgradeneeded = function(event) { 
    var db = event.target.result;
    
    db.onerror = function(event) {
      console.log("Error loading database.");
    };

    // Create an objectStore for this database
    var objectStore = db.createObjectStore("taskList", { keyPath: "key" });
    // define what data items the objectStore will contain
    objectStore.createIndex("key", "key", { unique: false });
    objectStore.createIndex("hours", "hours", { unique: false });
    objectStore.createIndex("minutes", "minutes", { unique: false });

    objectStore.createIndex("notified", "notified", { unique: false });

    console.log("Object store created.");
  };

    function deleteData() {
        // Open our object store and then get a cursor list of all the different data items in the IDB to iterate through
        var objectStore = db.transaction('taskList').objectStore('taskList');
        console.log(objectStore.count());
        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            // if there is still another cursor to go, keep runing this code
            if(cursor) {
                deleteItem(cursor.value.key);
                cursor.continue();
            }
        }
    }

  // give the form submit button an event listener so that when the form is submitted the addData() function is run
  taskForm.addEventListener('submit',addData,false);

  function addData(e) {
    // prevent default - we don't want the form to submit in the conventional way
    e.preventDefault();

    // Stop the form submitting if any values are left empty. This is just for browsers that don't support the HTML5 form
    // required attributes
    if(time.value == null) {
      console.log("Data not submitted — form incomplete.");
      return;
    } else {
      
      var timeString = time.value;
      var timeArray = timeString.split(":");

      var hours = timeArray[0];
      var minutes = timeArray[1];

      console.log(hours);
      console.log(minutes);

      // grab the values entered into the form fields and store them in an object ready for being inserted into the IDB
      var newItem = [
        { key:key, hours: hours, minutes: minutes, notified: "no" }
      ];

      console.log("here");

      // open a read/write db transaction, ready for adding the data
      var transaction = db.transaction(["taskList"], "readwrite");
    
      // report on the success of opening the transaction
      transaction.oncomplete = function() {
        console.log("Transaction completed: database modification finished.");

        // update the display of data to show the newly added item, by running displayData() again.
        // displayData(); 
      };

      transaction.onerror = function() {
        console.log("Transaction not opened due to error: " + transaction.error);
        showToastr("Cannot created time entry.", false);
      };

      // call an object store that's already been added to the database
      var objectStore = transaction.objectStore("taskList");
      console.log(objectStore.indexNames);
      console.log(objectStore.keyPath);
      console.log(objectStore.name);
      console.log(objectStore.transaction);
      console.log(objectStore.autoIncrement);

      // add our newItem object to the object store
      var objectStoreRequest = objectStore.put(newItem[0]);
        objectStoreRequest.onsuccess = function(event) {
          
          // report the success of our new item going into the database
          console.log("New item put to database.");
          showToastr("Time entry \"" + hours + ":" + minutes + "\" successfully created.", true);
          
          // clear the form, ready for adding the next entry
          // TODO

        };
      };
      
    };

  function deleteItem(dataTask) {
    // open a database transaction and delete the task, finding it by the name we retrieved above
    var transaction = db.transaction(["taskList"], "readwrite");
    var request = transaction.objectStore("taskList").delete(dataTask);

    // report that the data item has been deleted
    transaction.oncomplete = function() {
      console.log("Task " + dataTask + " deleted.");
    };
  };
  
  // this function checks whether the deadline for each task is up or not, and responds appropriately
  function checkDeadlines() {

    // grab the time and date right now 
    var now = new Date();

    // from the now variable, store the current minutes, hours, day of the month (getDate is needed for this, as getDay 
    // returns the day of the week, 1-7), month, year (getFullYear needed; getYear is deprecated, and returns a weird value
    // that is not much use to anyone!) and seconds
    var minuteCheck = now.getMinutes();
    var hourCheck = now.getHours();

    // again, open a transaction then a cursor to iterate through all the data items in the IDB   
    var objectStore = db.transaction(['taskList'], "readwrite").objectStore('taskList');
    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
        if(cursor) {

          // check if the current hours, minutes, day, month and year values match the stored values for each task in the IDB.
          // The + operator in this case converts numbers with leading zeros into their non leading zero equivalents, so e.g.
          // 09 -> 9. This is needed because JS date number values never have leading zeros, but our data might.
          // The secondsCheck = 0 check is so that you don't get duplicate notifications for the same task. The notification
          // will only appear when the seconds is 0, meaning that you won't get more than one notification for each task
          if(+(cursor.value.hours) == hourCheck && +(cursor.value.minutes) == minuteCheck && cursor.value.notified == "no") {

            // If the numbers all do match, run the createNotification() function to create a system notification
            getQuoteAndPushNotif();
          }
          
          // move on and perform the same deadline check on the next cursor item
          cursor.continue();
        }
    }
    
  }
  
  // function for creating the notification
  function createNotification(title) {
    console.log(title);
    // Let's check if the browser supports notifications
    if (!"Notification" in window) {
      console.log("This browser does not support notifications.");
    }

    // Let's check if the user is okay to get some notification
    else if (Notification.permission === "granted") {
      // If it's okay let's create a notification

      var img = '/img/icon-128.png';
      var text = 'Today quote: ' + title;
      var notification = new Notification('Daily quote', { body: text, icon: img });

      window.navigator.vibrate(500);
    }

    // Otherwise, we need to ask the user for permission
    // Note, Chrome does not implement the permission static property
    // So we have to check for NOT 'denied' instead of 'default'
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {

        // Whatever the user answers, we make sure Chrome stores the information
        if(!('permission' in Notification)) {
          Notification.permission = permission;
        }

        // If the user is okay, let's create a notification
        if (permission === "granted") {
          var img = 'img/icon-128.png';
          var text = 'Today quote: ' + title;
          var notification = new Notification('Daily quote', { body: text, icon: img });
          
          window.navigator.vibrate(500);
        } else {
          deleteItem(1);
        }
      });
    }
  };

  function getQuoteAndPushNotif() {
    getQuote().done(function(data) {
        var content = '"' + data.quote + '"';
        var author = data.author;

        createNotification(content + " - " + author);
    });
  };

  function showToastr(message, success) {
    toastr.options = {
      "closeButton": false,
      "debug": false,
      "newestOnTop": false,
      "progressBar": false,
      "positionClass": "toast-top-right",
      "preventDuplicates": false,
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "1000",
      "timeOut": "5000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    }
    if (success) {
      toastr["success"](message);
    } else {
      toastr["error"](message);
    }
  }

  // using a setInterval to run the checkDeadlines() function every minute
  setInterval(checkDeadlines, 60000);
}
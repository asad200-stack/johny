let items = [];
let selectedItems = [];
let tables = [];
let orders = [];
let currentTable = null;

// دالة الإشعارات الأنيقة
function showNotification(message, type = 'success') {
  const backgroundColor = type === 'success' ? '#2ecc71' : 
                         type === 'error' ? '#e74c3c' : 
                         type === 'warning' ? '#f39c12' : '#3498db';
  
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: backgroundColor,
    stopOnFocus: true,
    style: {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      borderRadius: '8px',
      padding: '12px 20px'
    }
  }).showToast();
}

// تحميل البيانات المحفوظة عند بدء التطبيق
window.onload = function() {
  console.log("بدء تحميل التطبيق...");
  loadAllData();
  console.log("تم تحميل البيانات. عدد الطاولات:", tables.length);
  checkIfCustomerView();
  checkConnectionStatus();
  console.log("اكتمل تحميل التطبيق");
};

// فحص حالة الاتصال
function checkConnectionStatus() {
  if (!navigator.onLine) {
    showNotification("أنت تعمل بدون إنترنت. البيانات محفوظة محلياً.", "warning");
  }
  
  window.addEventListener('online', function() {
    showNotification("تم استعادة الاتصال بالإنترنت!", "success");
  });
  
  window.addEventListener('offline', function() {
    showNotification("انقطع الاتصال بالإنترنت. يمكنك الاستمرار في العمل.", "warning");
  });
  
  // حفظ البيانات عند إغلاق الصفحة
  window.addEventListener('beforeunload', function() {
    saveAllData();
  });
  
  // حفظ البيانات كل دقيقة
  setInterval(() => {
    saveAllData();
  }, 60000);
}

// حفظ جميع البيانات في localStorage و IndexedDB
function saveAllData() {
  localStorage.setItem('restaurantItems', JSON.stringify(items));
  localStorage.setItem('restaurantTables', JSON.stringify(tables));
  localStorage.setItem('restaurantOrders', JSON.stringify(orders));
  
  // حفظ في IndexedDB للعمل بدون إنترنت
  if ('indexedDB' in window) {
    const request = indexedDB.open('CaveRestaurantDB', 1);
    
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      
      // إنشاء جداول البيانات
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tables')) {
        db.createObjectStore('tables', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // حفظ الأصناف
      const itemsStore = db.transaction(['items'], 'readwrite').objectStore('items');
      items.forEach(item => {
        itemsStore.put(item);
      });
      
      // حفظ الطاولات
      const tablesStore = db.transaction(['tables'], 'readwrite').objectStore('tables');
      tables.forEach(table => {
        tablesStore.put(table);
      });
      
      // حفظ الطلبات
      const ordersStore = db.transaction(['orders'], 'readwrite').objectStore('orders');
      orders.forEach(order => {
        ordersStore.put(order);
      });
    };
  }
}

// تحميل جميع البيانات من localStorage و IndexedDB
function loadAllData() {
  console.log("بدء تحميل البيانات...");
  const savedItems = localStorage.getItem('restaurantItems');
  const savedTables = localStorage.getItem('restaurantTables');
  const savedOrders = localStorage.getItem('restaurantOrders');
  
  console.log("البيانات المحفوظة:", { savedItems: !!savedItems, savedTables: !!savedTables, savedOrders: !!savedOrders });
  
  if (savedItems) {
    items = JSON.parse(savedItems);
    console.log("تم تحميل الأصناف:", items.length);
  }
  if (savedTables) {
    tables = JSON.parse(savedTables);
    console.log("تم تحميل الطاولات من localStorage:", tables.length);
    // تحديث QR Codes لجميع الطاولات لضمان الربط المباشر
    tables.forEach(table => {
      table.qrCode = generateQRCode(table.id);
    });
  } else {
    console.log("لم يتم العثور على طاولات محفوظة، سيتم إنشاء طاولات افتراضية");
    // إنشاء طاولات افتراضية إذا لم تكن موجودة
    tables = [
      { id: 1, name: 'Table 1', qrCode: generateQRCode(1), active: false },
      { id: 2, name: 'Table 2', qrCode: generateQRCode(2), active: false },
      { id: 3, name: 'Table 3', qrCode: generateQRCode(3), active: false },
      { id: 4, name: 'Table 4', qrCode: generateQRCode(4), active: false },
      { id: 5, name: 'Table 5', qrCode: generateQRCode(5), active: false }
    ];
    console.log("تم إنشاء طاولات افتراضية:", tables.length);
    saveAllData();
  }
  if (savedOrders) {
    orders = JSON.parse(savedOrders);
    console.log("تم تحميل الطلبات:", orders.length);
  }
  
  // تحميل من IndexedDB إذا كان متاحاً
  if ('indexedDB' in window) {
    const request = indexedDB.open('CaveRestaurantDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // تحميل الأصناف
      const itemsStore = db.transaction(['items'], 'readonly').objectStore('items');
      const itemsRequest = itemsStore.getAll();
      itemsRequest.onsuccess = function() {
        if (itemsRequest.result.length > 0) {
          items = itemsRequest.result;
        }
      };
      
      // تحميل الطاولات
      const tablesStore = db.transaction(['tables'], 'readonly').objectStore('tables');
      const tablesRequest = tablesStore.getAll();
      tablesRequest.onsuccess = function() {
        if (tablesRequest.result.length > 0) {
          tables = tablesRequest.result;
        }
      };
      
      // تحميل الطلبات
      const ordersStore = db.transaction(['orders'], 'readonly').objectStore('orders');
      const ordersRequest = ordersStore.getAll();
      ordersRequest.onsuccess = function() {
        if (ordersRequest.result.length > 0) {
          orders = ordersRequest.result;
        }
      };
    };
  }
}

// توليد QR code للطاولة - مرتبط مباشرة بقائمة الأصناف الحالية
function generateQRCode(tableId) {
  // إنشاء رابط ثابت لصفحة الطلب المنفصلة
  // قائمة الأصناف ستُحدث تلقائياً من localStorage
  return `${window.location.origin}/order.html?table=${tableId}`;
}

// التحقق من أن المستخدم يفتح رابط الطلب كزبون
function checkIfCustomerView() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderData = urlParams.get('order');
  const tableId = urlParams.get('table');
  
  if (tableId) {
    // واجهة الطلب للطاولة
    showTableCustomerInterface(parseInt(tableId));
  } else if (orderData) {
    try {
      const orderItems = JSON.parse(decodeURIComponent(orderData));
      showCustomerInterface(orderItems);
    } catch (e) {
      console.error('خطأ في تحليل بيانات الطلب:', e);
    }
  }
}

// التحقق من واجهة المطبخ


// عرض واجهة إضافة صنف جديد
function showAddItemForm() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2>Sardecoffeshop</h2>
    <h3>إضافة صنف جديد</h3>
         <input type="text" id="item-name" placeholder="اسم الصنف">
     <input type="number" id="item-price" placeholder="السعر باللبناني">
     <input type="text" id="item-features" placeholder="الخصائص (مفصولة بمسافة واحدة، مثال: طماطم كاتشاب بطاطا)">
    <button onclick="addItem()">💾 حفظ الصنف</button>
    <button onclick="showOrderInterface()" class="secondary-btn">← العودة للطلبات</button>
  `;
}

// إضافة صنف جديد
function addItem() {
  const name = document.getElementById("item-name").value;
  const price = parseInt(document.getElementById("item-price").value);
  const featuresText = document.getElementById("item-features").value;
  
  if (name && price > 0) {
    // تحويل النص إلى مصفوفة خصائص
    const features = featuresText.trim() ? featuresText.split(' ').filter(f => f.trim()) : [];
    
    const newItem = {
      id: Date.now(),
      name: name,
      price: price,
      features: features
    };
    
    items.push(newItem);
    saveAllData();
    
    // مسح الحقول
    document.getElementById("item-name").value = "";
    document.getElementById("item-price").value = "";
    document.getElementById("item-features").value = "";
    
    showNotification("تمت إضافة الصنف بنجاح! جميع QR Codes محدثة تلقائياً", "success");
    
    // حفظ تلقائي كل 5 دقائق
    setTimeout(() => {
      saveAllData();
    }, 300000);
  } else {
    showNotification("يرجى إدخال اسم وسعر صحيح.", "error");
  }
}

// عرض واجهة إدارة الطلبات
function showOrderInterface() {
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <h2>Sardecoffeshop</h2>
    <h3>إدارة الطلبات</h3>
    
    <div class="admin-controls">
      <input type="text" id="search-box" oninput="filterItems()" placeholder="ابحث عن صنف...">
      <button onclick="generateOrderLink()" class="generate-link-btn">🔗 توليد رابط الطلب</button>
    </div>
    
    <div id="items-list"></div>
    
    <div class="selected-items" id="selected-items">
      <h3>الطلب الحالي</h3>
      <div id="order-preview"></div>
      <div class="total-display" id="total-display">المجموع الكلي: 0 ل.ل</div>
      
      <div class="order-actions">
        <button onclick="printOrder()">🖨️ طباعة الطلبية</button>
        <button onclick="clearOrder()" class="clear-btn">🗑️ مسح الطلب</button>
      </div>
    </div>
    
    <div class="data-management">
      <h3>إدارة البيانات</h3>
      <div class="data-actions">
        <button onclick="exportData()" class="export-btn">📤 تصدير البيانات</button>
        <button onclick="importData()" class="import-btn">📥 استيراد البيانات</button>
      </div>
    </div>
  `;
  renderItems();
}

// عرض واجهة إدارة الطاولات
function showTablesInterface() {
  console.log("تم استدعاء showTablesInterface");
  const content = document.getElementById("main-content");
  console.log("عنصر main-content:", content);
  
  content.innerHTML = `
    <h2>Sardecoffeshop</h2>
    <h3>إدارة الطاولات</h3>
    
    <div class="system-stats">
      <div class="stat-card">
        <h4>الأصناف</h4>
        <span class="stat-number">${items.length}</span>
      </div>
      <div class="stat-card">
        <h4>الطاولات</h4>
        <span class="stat-number">${tables.length}</span>
      </div>
      <div class="stat-card">
        <h4>الطلبات النشطة</h4>
        <span class="stat-number">${orders.filter(o => o.status === 'pending').length}</span>
      </div>
      <div class="stat-card">
        <h4>الطاولات النشطة</h4>
        <span class="stat-number">${tables.filter(t => t.active).length}</span>
      </div>
    </div>
    
    <div class="tables-grid" id="tables-grid"></div>
    
    <div class="table-actions">
      <button onclick="addNewTable()" class="add-table-btn">➕ إضافة طاولة جديدة</button>
      <button onclick="showKitchenLink()" class="kitchen-btn">👨‍🍳 رابط المطبخ</button>
    </div>
  `;
  
  console.log("تم إنشاء HTML للواجهة، الآن سيتم استدعاء renderTables");
  renderTables();
}

// دالة طباعة QR للطاولة
function printTableQR(tableId) {
  const table = tables.find(t => t.id === tableId);
  if (!table) return;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>طباعة QR - ${table.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        @media print {
          body { margin: 0; padding: 15px; }
          .qr-container { text-align: center; page-break-inside: avoid; }
          .brand-title { font-size: 28px; font-weight: 600; margin-bottom: 8px; color: #b38728; }
          .brand-subtitle { font-size: 18px; font-weight: 400; margin-bottom: 15px; color: #8e44ad; }
          .table-name { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #2c3e50; }
          .qr-code { margin: 15px auto; }
          .qr-instruction { font-size: 14px; color: #34495e; margin-top: 12px; }
          .logo-placeholder { width: 60px; height: 60px; margin: 0 auto 15px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        }
        body { 
          font-family: 'Cairo', 'Poppins', sans-serif; 
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .qr-container { 
          text-align: center; 
          padding: 30px; 
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          max-width: 400px;
          margin: 0 auto;
        }
        .brand-title { 
          font-size: 32px; 
          font-weight: 600; 
          margin-bottom: 5px; 
          color: #b38728;
          font-family: 'Cairo', sans-serif;
        }
        .brand-subtitle { 
          font-size: 20px; 
          font-weight: 400; 
          margin-bottom: 20px; 
          color: #8e44ad;
          font-family: 'Cairo', sans-serif;
        }
        .table-name { 
          font-size: 24px; 
          font-weight: 600; 
          margin-bottom: 25px; 
          color: #2c3e50;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          display: inline-block;
        }
        .qr-code { 
          margin: 20px auto; 
          padding: 15px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .qr-instruction { 
          font-size: 16px; 
          color: #34495e; 
          margin-top: 20px;
          font-weight: 500;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          border-right: 4px solid #3498db;
        }
        .logo-placeholder { 
          width: 80px; 
          height: 80px; 
          margin: 0 auto 20px; 
          background: linear-gradient(135deg, #b38728, #8e44ad);
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        @media print {
          body { background: white; }
          .qr-container { box-shadow: none; border: 1px solid #dee2e6; }
        }
      </style>
    </head>
    <body>
      <div class="qr-container">
        <div class="logo-placeholder">S</div>
        <div class="brand-title">Sardé</div>
        <div class="brand-subtitle">سردة</div>
        <div class="table-name">${table.name}</div>
        <div class="qr-code">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(table.qrCode)}" 
               alt="QR Code for ${table.name}" style="border: 2px solid #3498db; border-radius: 10px;" />
        </div>
        <div class="qr-instruction">امسح هذا الكود للطلب من طاولتك</div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// عرض الطاولات
function renderTables() {
  const grid = document.getElementById("tables-grid");
  console.log("البحث عن عنصر tables-grid:", grid);
  if (!grid) {
    console.error("لم يتم العثور على عنصر tables-grid!");
    return;
  }
  
  grid.innerHTML = "";
  
  console.log("عدد الطاولات:", tables.length);
  console.log("محتوى مصفوفة الطاولات:", tables);
  
  tables.forEach((table, index) => {
    console.log(`معالجة الطاولة ${index + 1}:`, table);
    const tableCard = document.createElement("div");
    tableCard.className = `table-card ${table.active ? 'active' : ''}`;
    tableCard.innerHTML = `
      <h3>${table.name}</h3>
      <div class="table-status">
        <span class="status-indicator ${table.active ? 'active' : ''}"></span>
        ${table.active ? 'نشطة' : 'غير نشطة'}
      </div>
      <div class="table-qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(table.qrCode)}" 
             alt="QR Code for ${table.name}" />
      </div>
      <div class="table-actions">
        <button onclick="toggleTableStatus(${table.id})" class="toggle-btn">
          ${table.active ? 'إيقاف' : 'تفعيل'}
        </button>
        <button onclick="printTableQR(${table.id})" class="print-btn">🖨️ طباعة</button>
        <button onclick="deleteTable(${table.id})" class="delete-btn">🗑️ حذف</button>
      </div>
    `;
    grid.appendChild(tableCard);
    console.log("تم إضافة طاولة:", table.name, "مع زر الطباعة");
  });
  
  console.log("انتهى عرض الطاولات. عدد العناصر في الجدول:", grid.children.length);
}

// إضافة طاولة جديدة
function addNewTable() {
  const newTableId = Math.max(...tables.map(t => t.id), 0) + 1;
  const newTable = {
    id: newTableId,
    name: `Table ${newTableId}`,
    qrCode: generateQRCode(newTableId),
    active: false
  };
  
  tables.push(newTable);
  saveAllData();
  renderTables();
  showNotification("تمت إضافة الطاولة بنجاح! QR Code محدث تلقائياً", "success");
  
  // إضافة طاولة تجريبية للتأكد من ظهور زر الطباعة
  console.log("تم إضافة طاولة جديدة:", newTable);
  console.log("زر الطباعة موجود في الكود");
}

// تبديل حالة الطاولة
function toggleTableStatus(tableId) {
  const table = tables.find(t => t.id === tableId);
  if (table) {
    table.active = !table.active;
    saveAllData();
    renderTables();
    showNotification(`تم ${table.active ? 'تفعيل' : 'إيقاف'} الطاولة ${table.name}`, "success");
  }
}

// حذف طاولة
function deleteTable(tableId) {
  if (confirm("هل أنت متأكد من حذف هذه الطاولة؟")) {
    tables = tables.filter(t => t.id !== tableId);
    saveAllData();
    renderTables();
    showNotification("تم حذف الطاولة بنجاح!", "success");
  }
}

// عرض رابط المطبخ
function showKitchenLink() {
  const kitchenUrl = `${window.location.origin}${window.location.pathname.replace('index.html', 'kitchen.html')}`;
  
  // فتح صفحة المطبخ في نافذة جديدة
  window.open(kitchenUrl, '_blank');
  
  showNotification("تم فتح صفحة المطبخ في نافذة جديدة!", "success");
}

// تصدير البيانات
function exportData() {
  const data = {
    items: items,
    tables: tables,
    orders: orders,
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `cave-restaurant-data-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showNotification("تم تصدير البيانات بنجاح!", "success");
}

// استيراد البيانات
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.items) items = data.items;
          if (data.tables) tables = data.tables;
          if (data.orders) orders = data.orders;
          
          saveAllData();
          showNotification("تم استيراد البيانات بنجاح!", "success");
          
          // إعادة تحميل الواجهة
          if (document.getElementById("main-content")) {
            showOrderInterface();
          }
        } catch (error) {
          showNotification("خطأ في قراءة الملف!", "error");
        }
      };
      reader.readAsText(file);
    }
  };
  
  input.click();
}

// عرض واجهة الطلب للطاولة
function showTableCustomerInterface(tableId) {
  currentTable = tableId;
  const table = tables.find(t => t.id === tableId);
  
  // إخفاء الشريط الجانبي
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.style.display = 'none';
  
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <div class="customer-header">
      <div class="restaurant-brand">
        <h1 class="brand-title">Sardé</h1>
        <h2 class="brand-subtitle">سردة</h2>
        <div class="brand-divider"></div>
      </div>
      <div class="table-info">
        <h3>مرحباً بك في ${table ? table.name : `الطاولة ${tableId}`}!</h3>
        <p>اختر من قائمة طعامنا الشهية</p>
      </div>
    </div>
    
    <div class="customer-interface">
      <div class="menu-section">
        <h3>📋 قائمة الطعام</h3>
        <input type="text" id="search-box" oninput="filterCustomerItems()" placeholder="ابحث عن صنف...">
        <div id="customer-items-list"></div>
      </div>
      
      <div class="order-section">
        <h3>🛒 طلبك</h3>
        <div id="customer-order-preview"></div>
        <div class="total-display" id="customer-total">المجموع الكلي: 0 ل.ل</div>
        
        <div class="customer-info">
          <h4>ملاحظات خاصة</h4>
          <textarea id="customer-notes" placeholder="اكتب ملاحظاتك هنا (مثل: بدون ملح، زيادة صوص، عيد ميلاد...)" class="customer-input"></textarea>
        </div>
        
        <div class="order-actions">
          <button onclick="sendTableOrder()" class="send-order-btn">📤 إرسال الطلبية</button>
          <button onclick="clearCustomerOrder()" class="clear-btn">🗑️ مسح الطلب</button>
          <button onclick="requestService()" class="service-btn">🔔 طلب مراجعة</button>
        </div>
      </div>
    </div>
  `;
  
  selectedItems = [];
  renderCustomerItems();
}

// إرسال طلب الطاولة
function sendTableOrder() {
  if (selectedItems.length === 0) {
    showNotification("يرجى اختيار أصناف للطلب أولاً", "warning");
    return;
  }
  
  const notes = document.getElementById("customer-notes")?.value || "";
  
  // تنسيق الطلب حسب المطلوب
  const order = {
    id: Date.now(),
    table: currentTable,
    items: selectedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      options: item.selectedFeatures || []
    })),
    note: notes,
    status: 'new',
    time: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  
  // حفظ الطلب في localStorage
  const existingOrders = JSON.parse(localStorage.getItem('restaurantOrders') || '[]');
  existingOrders.push(order);
  localStorage.setItem('restaurantOrders', JSON.stringify(existingOrders));
  
  // حفظ في orders array للتوافق مع النظام الحالي
  orders.push({
    ...order,
    tableId: currentTable,
    timestamp: new Date().toISOString(),
    total: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  });
  saveAllData();
  
  // تفعيل الطاولة
  const table = tables.find(t => t.id === currentTable);
  if (table) {
    table.active = true;
    saveAllData();
  }
  
  showNotification("تم إرسال طلبك بنجاح! سيتم تحضيره قريباً", "success");
  
  // مسح الطلب
  selectedItems = [];
  renderCustomerOrder();
  document.getElementById("customer-notes").value = "";
  
  // إلغاء تحديد جميع الصناديق
  document.querySelectorAll('#customer-items-list input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}



// طلب مراجعة
function requestService() {
  if (!currentTable) {
    showNotification("لا يمكن طلب مراجعة بدون طاولة", "error");
    return;
  }
  
  const serviceRequest = {
    id: Date.now(),
    tableId: currentTable,
    type: 'service',
    timestamp: new Date().toISOString(),
    message: `طلب مراجعة من الطاولة ${currentTable}`
  };
  
  // حفظ طلب المراجعة
  const serviceRequests = JSON.parse(localStorage.getItem('serviceRequests') || '[]');
  serviceRequests.push(serviceRequest);
  localStorage.setItem('serviceRequests', JSON.stringify(serviceRequests));
  
  showNotification("تم إرسال طلب المراجعة! سيأتي أحد الموظفين قريباً", "success");
}

// عرض واجهة المطبخ
function showKitchenInterface() {
  // توجيه المستخدم إلى صفحة المطبخ المنفصلة
  const kitchenUrl = `${window.location.origin}${window.location.pathname.replace('index.html', 'kitchen.html')}`;
  window.open(kitchenUrl, '_blank');
  showNotification("تم فتح صفحة المطبخ في نافذة جديدة!", "success");
}



// توليد رابط الطلب للزبون
function generateOrderLink() {
  if (items.length === 0) {
    showNotification("لا توجد أصناف متاحة. يرجى إضافة أصناف أولاً.", "warning");
    return;
  }
  
  const orderData = encodeURIComponent(JSON.stringify(items));
  const orderUrl = `${window.location.origin}${window.location.pathname}?order=${orderData}`;
  
  // نسخ الرابط للحافظة
  navigator.clipboard.writeText(orderUrl).then(() => {
    showNotification("تم نسخ رابط الطلب! يمكنك الآن إرساله للزبون.", "success");
  }).catch(() => {
    // إذا فشل النسخ التلقائي، اعرض الرابط في مربع حوار
    const copiedUrl = prompt("رابط الطلب (انسخه يدوياً):", orderUrl);
    if (copiedUrl) {
      showNotification("تم نسخ الرابط بنجاح!", "success");
    }
  });
}

// عرض واجهة الزبون
function showCustomerInterface(orderItems) {
  // إخفاء الشريط الجانبي
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.style.display = 'none';
  
  const content = document.getElementById("main-content");
  content.innerHTML = `
    <div class="customer-header">
      <div class="restaurant-brand">
        <h1 class="brand-title">Sardé</h1>
        <h2 class="brand-subtitle">سردة</h2>
        <div class="brand-divider"></div>
      </div>
      <div class="table-info">
        <h3>مرحباً بك!</h3>
        <p>اختر من قائمة طعامنا الشهية</p>
      </div>
    </div>
    
    <div class="customer-interface">
      <div class="menu-section">
        <h3>📋 قائمة الطعام</h3>
        <input type="text" id="search-box" oninput="filterCustomerItems()" placeholder="ابحث عن صنف...">
        <div id="customer-items-list"></div>
      </div>
      
      <div class="order-section">
        <h3>🛒 طلبك</h3>
        <div id="customer-order-preview"></div>
        <div class="total-display" id="customer-total">المجموع الكلي: 0 ل.ل</div>
        
        <div class="customer-info">
          <h4>معلومات التوصيل</h4>
          <input type="text" id="customer-name" placeholder="اسمك" class="customer-input" required>
          <input type="text" id="customer-address" placeholder="عنوانك" class="customer-input" required>
          <input type="tel" id="customer-phone" placeholder="رقم الهاتف" class="customer-input">
        </div>
        
                 <div class="order-actions">
           <button onclick="sendCustomerOrder()" class="send-order-btn">📤 إرسال الطلبية</button>
           <button onclick="clearCustomerOrder()" class="clear-btn">🗑️ مسح الطلب</button>
         </div>
      </div>
    </div>
  `;
  
  // تعيين الأصناف للعرض
  items = orderItems;
  selectedItems = [];
  renderCustomerItems();
}

// عرض الأصناف للزبون
function renderCustomerItems(list = items) {
  const listContainer = document.getElementById("customer-items-list");
  if (!listContainer) return;
  
  listContainer.innerHTML = "";

  if (list.length === 0) {
    listContainer.innerHTML = "<p class=\"no-items\">لا توجد أصناف متاحة</p>";
    return;
  }

  list.forEach((item, index) => {
    const id = `customer-item-${index}`;
    const box = document.createElement("div");
    box.className = "customer-item-box";
    box.innerHTML = `
      <div class="item-info">
        <input type="checkbox" id="${id}" onchange="toggleCustomerItem(${index}, this.checked)">
        <label for="${id}">
          <span class="item-name">${item.name}</span>
          <span class="item-price">${item.price.toLocaleString()} ل.ل</span>
        </label>
      </div>
      ${item.features && item.features.length > 0 ? `
        <div class="features-section">
          <p class="features-title">اختر الخصائص:</p>
          <div class="features-list">
            ${item.features.map((feature, featureIndex) => `
              <label class="feature-checkbox">
                <input type="checkbox" id="feature-${index}-${featureIndex}" 
                       onchange="updateItemFeatures(${index}, '${feature}', this.checked)">
                <span>${feature}</span>
              </label>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    listContainer.appendChild(box);
  });
}

// فلترة الأصناف للزبون
function filterCustomerItems() {
  const search = document.getElementById("search-box").value.toLowerCase();
  const filtered = items.filter(i => i.name.toLowerCase().includes(search));
  renderCustomerItems(filtered);
}

// إضافة/إزالة صنف من طلب الزبون
function toggleCustomerItem(index, checked) {
  const item = items[index];
  if (checked) {
    selectedItems.push({ ...item, quantity: 1 });
  } else {
    selectedItems = selectedItems.filter(i => i.id !== item.id);
  }
  renderCustomerOrder();
}

// عرض طلب الزبون
function renderCustomerOrder() {
  const container = document.getElementById("customer-order-preview");
  if (!container) return;
  
  container.innerHTML = "";

  if (selectedItems.length === 0) {
    container.innerHTML = "<p class=\"empty-order\">لم تختر أي أصناف بعد</p>";
    document.getElementById("customer-total").innerText = "المجموع الكلي: 0 ل.ل";
    return;
  }

  selectedItems.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "order-item-row";
    row.innerHTML = `
      <div class="item-details">
        <span class="item-name">${item.name}</span>
        <span class="item-price">${item.price.toLocaleString()} ل.ل</span>
      </div>
      <div class="quantity-controls">
        <button onclick="updateCustomerQty(${idx}, ${item.quantity - 1})" class="qty-btn">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button onclick="updateCustomerQty(${idx}, ${item.quantity + 1})" class="qty-btn">+</button>
      </div>
    `;
    container.appendChild(row);
  });

  calculateCustomerTotal();
}

// تحديث كمية صنف في طلب الزبون
function updateCustomerQty(index, newQty) {
  if (newQty < 1) {
    selectedItems.splice(index, 1);
  } else {
    selectedItems[index].quantity = newQty;
  }
  renderCustomerOrder();
}

// حساب المجموع للزبون
function calculateCustomerTotal() {
  let total = 0;
  selectedItems.forEach(item => {
    total += item.price * item.quantity;
  });
  document.getElementById("customer-total").innerText = "المجموع الكلي: " + total.toLocaleString() + " ل.ل";
}

// إرسال طلب الزبون عبر واتساب
function sendCustomerOrder() {
  const customerName = document.getElementById("customer-name")?.value;
  const customerAddress = document.getElementById("customer-address")?.value;
  const customerPhone = document.getElementById("customer-phone")?.value;
  
  if (selectedItems.length === 0) {
    showNotification("يرجى اختيار أصناف للطلب أولاً", "warning");
    return;
  }
  
  if (!customerName || !customerAddress) {
    showNotification("يرجى إدخال الاسم والعنوان", "error");
    return;
  }
  
  // تنسيق الطلب حسب المطلوب
  const order = {
    id: Date.now(),
    table: 0, // طلب خارجي
    items: selectedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      options: item.selectedFeatures || []
    })),
    note: `اسم الزبون: ${customerName} | العنوان: ${customerAddress}${customerPhone ? ` | الهاتف: ${customerPhone}` : ''}`,
    status: 'new',
    time: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  
  // حفظ الطلب في localStorage
  const existingOrders = JSON.parse(localStorage.getItem('restaurantOrders') || '[]');
  existingOrders.push(order);
  localStorage.setItem('restaurantOrders', JSON.stringify(existingOrders));
  
  // حفظ في orders array للتوافق مع النظام الحالي
  orders.push({
    ...order,
    tableId: 0,
    timestamp: new Date().toISOString(),
    total: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  });
  saveAllData();
  
  showNotification("تم إرسال طلبك بنجاح! سيتم التواصل معكم قريباً", "success");
  
  // مسح الطلب
  selectedItems = [];
  renderCustomerOrder();
  
  // مسح البيانات المدخلة
  document.getElementById("customer-name").value = "";
  document.getElementById("customer-address").value = "";
  document.getElementById("customer-phone").value = "";
  
  // إلغاء تحديد جميع الصناديق
  document.querySelectorAll('#customer-items-list input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

// تحديث خصائص الصنف المحدد
function updateItemFeatures(itemIndex, feature, checked) {
  const item = selectedItems.find(i => i.id === items[itemIndex].id);
  if (item) {
    if (!item.selectedFeatures) {
      item.selectedFeatures = [];
    }
    
    if (checked) {
      if (!item.selectedFeatures.includes(feature)) {
        item.selectedFeatures.push(feature);
      }
    } else {
      item.selectedFeatures = item.selectedFeatures.filter(f => f !== feature);
    }
  }
}

// مسح طلب الزبون
function clearCustomerOrder() {
  selectedItems = [];
  renderCustomerOrder();
  // إلغاء تحديد جميع الصناديق
  document.querySelectorAll('#customer-items-list input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

// فلترة الأصناف في واجهة الإدارة
function filterItems() {
  const search = document.getElementById("search-box").value.toLowerCase();
  const filtered = items.filter(i => i.name.toLowerCase().includes(search));
  renderItems(filtered);
}

// عرض الأصناف في واجهة الإدارة
function renderItems(list = items) {
  const listContainer = document.getElementById("items-list");
  if (!listContainer) return;
  
  listContainer.innerHTML = "";

  if (list.length === 0) {
    listContainer.innerHTML = "<p class=\"no-items\">لا توجد أصناف</p>";
    return;
  }

  list.forEach((item, index) => {
    const id = `item-${index}`;
    const box = document.createElement("div");
    box.className = "item-box";
    box.innerHTML = `
      <div class="item-info">
        <input type="checkbox" id="${id}" onchange="toggleItem(${index}, this.checked)">
        <label for="${id}">
          <span class="item-name">${item.name}</span>
          <span class="item-price">${item.price.toLocaleString()} ل.ل</span>
        </label>
      </div>
      ${item.features && item.features.length > 0 ? `<p class="item-features">الخصائص: ${item.features.join(', ')}</p>` : ''}
      <button onclick="deleteItem(${index})" class="delete-btn">🗑️ حذف</button>
    `;
    listContainer.appendChild(box);
  });
}

// إضافة/إزالة صنف من الطلب في واجهة الإدارة
function toggleItem(index, checked) {
  const item = items[index];
  if (checked) {
    selectedItems.push({ ...item, quantity: 1 });
  } else {
    selectedItems = selectedItems.filter(i => i.id !== item.id);
  }
  renderSelected();
}

// عرض الطلب المحدد في واجهة الإدارة
function renderSelected() {
  const container = document.getElementById("order-preview");
  if (!container) return;
  
  container.innerHTML = "";

  selectedItems.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "order-item-row";
    row.innerHTML = `
      <div class="item-details">
        <span class="item-name">${item.name}</span>
        <span class="item-price">${item.price.toLocaleString()} ل.ل</span>
      </div>
      <div class="quantity-controls">
        <button onclick="updateQty(${idx}, ${item.quantity - 1})" class="qty-btn">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button onclick="updateQty(${idx}, ${item.quantity + 1})" class="qty-btn">+</button>
      </div>
    `;
    container.appendChild(row);
  });

  calculateTotal();
}

// تحديث كمية في واجهة الإدارة
function updateQty(index, newQty) {
  if (newQty < 1) {
    selectedItems.splice(index, 1);
  } else {
    selectedItems[index].quantity = newQty;
  }
  renderSelected();
}

// حساب المجموع في واجهة الإدارة
function calculateTotal() {
  let total = 0;
  selectedItems.forEach(item => {
    total += item.price * item.quantity;
  });
  const totalDisplay = document.getElementById("total-display");
  if (totalDisplay) {
    totalDisplay.innerText = "المجموع الكلي: " + total.toLocaleString() + " ل.ل";
  }
}

// حذف صنف
function deleteItem(index) {
  if (confirm("هل أنت متأكد من حذف هذا الصنف؟")) {
    items.splice(index, 1);
    saveAllData();
    renderItems();
  }
}

// مسح الطلب في واجهة الإدارة
function clearOrder() {
  selectedItems = [];
  renderSelected();
  // إلغاء تحديد جميع الصناديق
  document.querySelectorAll('#items-list input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

// طباعة الطلب
function printOrder() {
  if (selectedItems.length === 0) {
    showNotification("لا توجد أصناف محددة للطباعة", "warning");
    return;
  }
  
  let content = `CAVE RESTAURANT\n`;
  content += `═══════════════════\n\n`;
  content += `التاريخ: ${new Date().toLocaleDateString('ar-LB')}\n`;
  content += `الوقت: ${new Date().toLocaleTimeString('ar-LB')}\n`;
  content += `═══════════════════\n\n`;
  
  content += selectedItems.map(item =>
    `${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} ل.ل`
  ).join("\n");

  let total = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  content += "\n\n═══════════════════\n";
  content += "المجموع: " + total.toLocaleString() + " ل.ل";

  let win = window.open("", "", "height=700,width=900");
  win.document.write(`
  <html>
    <head>
      <style>
        body {
          font-size: 22px;
          font-family: 'Arial', sans-serif;
          direction: rtl;
          padding: 20px;
          text-align: center;
        }
        .restaurant-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .divider {
          border-top: 2px solid #000;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <pre>${content}</pre>
    </body>
  </html>
`);
  win.print();
}
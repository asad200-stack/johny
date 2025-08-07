// متغيرات عامة
let orders = [];
let serviceRequests = [];
let updateInterval;

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

// تحميل البيانات عند بدء التطبيق
window.onload = function() {
  loadOrders();
  loadServiceRequests();
  startAutoUpdate();
  updateLastUpdateTime();
};

// بدء التحديث التلقائي كل 5 ثواني
function startAutoUpdate() {
  updateInterval = setInterval(() => {
    loadOrders();
    loadServiceRequests();
    updateLastUpdateTime();
  }, 5000);
}

// تحديث وقت آخر تحديث
function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ar-LB');
  document.getElementById('last-update').textContent = timeString;
}

// تحميل الطلبات من localStorage
function loadOrders() {
  try {
    const savedOrders = localStorage.getItem('restaurantOrders');
    if (savedOrders) {
      orders = JSON.parse(savedOrders);
    }
    renderOrders();
    updateOrderCounts();
  } catch (error) {
    console.error('خطأ في تحميل الطلبات:', error);
    showNotification('خطأ في تحميل الطلبات', 'error');
  }
}

// تحميل طلبات المراجعة
function loadServiceRequests() {
  try {
    const savedRequests = localStorage.getItem('serviceRequests');
    if (savedRequests) {
      serviceRequests = JSON.parse(savedRequests);
    }
    renderServiceRequests();
  } catch (error) {
    console.error('خطأ في تحميل طلبات المراجعة:', error);
  }
}

// عرض الطلبات
function renderOrders() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  // فلترة الطلبات الجديدة فقط
  const newOrders = orders.filter(order => order.status === 'new');
  
  if (newOrders.length === 0) {
    container.innerHTML = '<div class="no-orders">لا توجد طلبات جديدة</div>';
    return;
  }

  container.innerHTML = newOrders.map(order => `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-header">
        <h3>🪑 طاولة ${order.table}</h3>
        <span class="order-time">${formatTime(order.time)}</span>
      </div>
      
      <div class="order-items">
        <h4>📋 الأصناف المطلوبة:</h4>
        <ul>
          ${order.items.map(item => `
            <li>
              <span class="item-name">${item.name}</span>
              <span class="item-quantity">× ${item.quantity}</span>
              ${item.options && item.options.length > 0 ? 
                `<span class="item-options">(${item.options.join(', ')})</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
      
      ${order.note ? `
        <div class="order-notes">
          <h4>📝 ملاحظات:</h4>
          <p>${order.note}</p>
        </div>
      ` : ''}
      
      <div class="order-actions">
        <button onclick="completeOrder(${order.id})" class="complete-btn">
          ✅ تم التحضير
        </button>
      </div>
    </div>
  `).join('');
}

// عرض طلبات المراجعة
function renderServiceRequests() {
  const container = document.getElementById('service-requests');
  if (!container) return;

  // فلترة الطلبات النشطة فقط
  const activeRequests = serviceRequests.filter(req => req.status !== 'completed');
  
  if (activeRequests.length === 0) {
    container.innerHTML = '<div class="no-requests">لا توجد طلبات مراجعة</div>';
    return;
  }

  container.innerHTML = activeRequests.map(request => `
    <div class="service-request-card" data-request-id="${request.id}">
      <div class="request-header">
        <h4>🔔 طلب مراجعة</h4>
        <span class="request-time">${formatTime(request.timestamp)}</span>
      </div>
      
      <div class="request-content">
        <p><strong>الطاولة:</strong> ${request.tableId}</p>
        <p><strong>الرسالة:</strong> ${request.message}</p>
      </div>
      
      <div class="request-actions">
        <button onclick="completeService(${request.id})" class="complete-service-btn">
          ✅ تمت المراجعة
        </button>
      </div>
    </div>
  `).join('');
}

// تحديث عدد الطلبات
function updateOrderCounts() {
  const newOrdersCount = orders.filter(order => order.status === 'new').length;
  const doneOrdersCount = orders.filter(order => order.status === 'done').length;
  
  document.getElementById('new-orders-count').textContent = newOrdersCount;
  document.getElementById('done-orders-count').textContent = doneOrdersCount;
}

// إكمال طلب
function completeOrder(orderId) {
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    showNotification('لم يتم العثور على الطلب', 'error');
    return;
  }

  orders[orderIndex].status = 'done';
  orders[orderIndex].completedTime = new Date().toISOString();
  
  // حفظ التحديث
  localStorage.setItem('restaurantOrders', JSON.stringify(orders));
  
  showNotification(`تم إكمال طلب الطاولة ${orders[orderIndex].table}!`, 'success');
  
  // إعادة تحميل العرض
  renderOrders();
  updateOrderCounts();
}

// إكمال طلب مراجعة
function completeService(requestId) {
  const requestIndex = serviceRequests.findIndex(req => req.id === requestId);
  if (requestIndex === -1) {
    showNotification('لم يتم العثور على طلب المراجعة', 'error');
    return;
  }

  serviceRequests[requestIndex].status = 'completed';
  serviceRequests[requestIndex].completedTime = new Date().toISOString();
  
  // حفظ التحديث
  localStorage.setItem('serviceRequests', JSON.stringify(serviceRequests));
  
  showNotification(`تم إكمال طلب المراجعة للطاولة ${serviceRequests[requestIndex].tableId}!`, 'success');
  
  // إعادة تحميل العرض
  renderServiceRequests();
}

// تنسيق الوقت
function formatTime(timeString) {
  try {
    const date = new Date(timeString);
    return date.toLocaleString('ar-LB');
  } catch (error) {
    return timeString;
  }
}

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

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
}

// بدء فحص الاتصال
checkConnectionStatus(); 
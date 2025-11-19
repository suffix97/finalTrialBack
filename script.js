// general information

const baseUrl = "https://livejs-api.hexschool.io";
const apiPath = "suffix97";
const auth = {
  headers: {
    Authorization: "QVCAXqMuZETapJfvCbkqO8ro4fo1",
  },
};

//1 取得購物車資料
let orderList = [];
// 取得c3 chart data
let catChart = [];
let itemChart = [];
// select c3 chart title
const chartTitle = document.querySelector(".wrap .section-title");

const getCart = async () => {
  const url = `${baseUrl}/api/livejs/v1/admin/${apiPath}/orders`;
  try {
    let res = await axios.get(url, auth);
    orderList = res.data.orders;
    //選染order list
    renderOrderList(orderList);
    //渲染chart (預設 catagory chart)
    catChart = categoryPieChart(orderList);
    itemChart = itemPieChart(orderList);
    renderChart(
      chartTitle.textContent === "全分類營收比重" ? catChart : itemChart
    );
  } catch (error) {
    errorMsg("取得購物車資料失敗，請洽客服");
  }
};

//1.1 渲染購物車清單列表

const renderOrderList = (data) => {
  if (data.length === 0) {
    //如果購物車是空的停用刪除全部按鈕
    document.querySelector(".discardAllBtn").classList.add("disabled-link");
  } else {
    document.querySelector(".discardAllBtn").classList.remove("disabled-link");
    let renderData = data
      .map((item) => {
        //1.1.1 取得購物清單產品列表
        let products = item.products
          .map((item) => {
            return `
            <p>${item.title} x ${item.quantity} </p>
        `;
          })
          .join("");
        // 1.1.2 取得時間格式
        let date = new Date(item.createdAt * 1000).toLocaleDateString("zh-TW");
        // 1.1.3 取的購物清單
        return `
    <tr>
              <td>${item.id}</td>
              <td>
                <p>${item.user.name}</p>
                <p>${item.user.tel}</p>
              </td>
              <td>${item.user.address}</td>
              <td>${item.user.email}</td>
              <td>
                ${products}
              </td>
              <td>${date}</td>
              <td class="orderStatus">
                <a href="#" class='js-status' id=js-${item.id} data-paid=${
          item.paid
        }>${item.paid ? "已付款" : "未付款"}</a>
              </td>
              <td>
                <input type="button" class="delSingleOrder-Btn" value="刪除" data-id="${
                  item.id
                }"/>
              </td>
            </tr>

    `;
      })
      .join("");
    // 1.1.4 render page
    document.querySelector(".orderPage-table tbody").innerHTML = renderData;
    // 1.1.5 add event listener for del button and status button
    orderTableEventListen();
  }
};

//1.2 刪除個別購物車選項

const delOrder = async (paidStatus, cartId) => {
  if (paidStatus === "true") {
    Swal.fire("已付款訂單不可以刪除");
    return;
  } else {
    let url = `${baseUrl}/api/livejs/v1/admin/${apiPath}/orders/${cartId}`;
    try {
      let res = await axios.delete(url, auth);
      orderList = res.data.orders;
      //刪除後重新渲染order List;
      renderOrderList(orderList);
      //重新渲染chart
      cattData = categoryPieChart(orderList);
      itemChart = itemPieChart(orderList);
      renderChart(
        chartTitle.textContent === "全分類營收比重" ? catData : itemChart
      );
    } catch (error) {
      errorMsg("刪除購物車資料失敗，請洽客服");
    }
  }
};

//1.3 個別刪除及狀態改變監聽

const orderTableEventListen = () => {
  document
    .querySelector(".orderPage-table tbody")
    .addEventListener("click", (e) => {
      //監聽 刪除按鈕
      if (e.target.className === "delSingleOrder-Btn") {
        e.preventDefault();
        let status = document.querySelector(`#js-${e.target.dataset.id}`)
          .dataset.paid;
        let id = e.target.dataset.id;
        delOrder(status, id);
        //監聽改變狀態按鈕
      } else if (e.target.className === "js-status") {
        e.preventDefault();
        let url = `${baseUrl}/api/livejs/v1/admin/${apiPath}/orders`;
        let data = {
          data: {
            id: e.target.id.slice(3),
            paid: e.target.dataset.paid === "true" ? false : true,
          },
        };
        axios
          .put(url, data, auth)
          .then((res) => {
            orderList = res.data.orders;
            renderOrderList(orderList);
          })
          .catch((error) => {
            errorMsg("變更付款狀態失敗，請洽客服");
          });
      } else {
        return;
      }
    });
};

//1.4 刪除所有資料按鈕

const delAllBtn = () => {
  document.querySelector(".discardAllBtn").addEventListener("click", (e) => {
    e.preventDefault();
    let payStatus = false;
    orderList.forEach((item) => {
      if (item.paid) {
        payStatus = true;
      }
    });
    if (payStatus === true) {
      Swal.fire("購物車包含已付款訂單，無法刪除");
      return;
    } else {
      let url = `${baseUrl}/api/livejs/v1/admin/${apiPath}/orders`;
      axios
        .delete(url, auth)
        .then((res) => {
          Swal.fire({
            position: "bottom-end",
            icon: "success",
            title: "成功刪除所有訂單",
            showConfirmButton: false,
            timer: 1500,
          });
          getCart();
        })
        .catch((error) => {
          errorMsg("刪除購物車失敗，請洽客服");
        });
    }
  });
};

//2.1 三項類別圓餅圖(全產品類別營收比重)
const categoryPieChart = (data) => {
  let arr = {};
  data.forEach((item) => {
    item.products.forEach((productItem) => {
      if (arr[productItem.category]) {
        arr[productItem.category] += productItem.quantity * productItem.price;
      } else {
        arr[productItem.category] = productItem.quantity * productItem.price;
      }
    });
  });

  return Object.entries(arr);
};

//2.2 全品項圓餅圖(全品項圓餅圖，列出前三名，剩下的為其他)
const itemPieChart = (data) => {
  let arr = {};
  data.forEach((item) => {
    item.products.forEach((productItem) => {
      if (arr[productItem.title]) {
        arr[productItem.title] += productItem.quantity * productItem.price;
      } else {
        arr[productItem.title] = productItem.quantity * productItem.price;
      }
    });
  });
  //按照金額由低到高排列品項
  let arrList = Object.entries(arr).sort((a, b) => b[1] - a[1]);
  //截取前三名的項目
  let firstThreeItem = arrList.splice(0, 3);
  //計算其他品相金額
  let restItem = arrList.reduce(
    (acc, value) => {
      acc[1] += value[1];
      return acc;
    },
    ["其他", 0]
  );
  firstThreeItem.push(restItem);
  return firstThreeItem;
};

//2.3 輸入資料渲染圖表
const renderChart = (arr) => {
  let chart = c3.generate({
    bindto: "#chart", // HTML 元素綁定
    data: {
      type: "pie",
      columns: arr,
    },
    color: {
      pattern: [
        "#8A2BE2", // 紫羅蘭
        "#9370DB", // 中紫
        "#BA55D3", // 紫紅
        "#DA70D6", // 淡紫紅
        "#D8BFD8", // 淡紫
        "#E6E6FA", // 薰衣草
        "#C8A2C8", // 紫灰
        "#DDA0DD", // 李子紫
        "#EE82EE", // 紫羅蘭紅
        "#F3E5F5", // 極淡紫
        "#B39DDB", // 柔紫
        "#AB47BC", // Material 淡紫
        "#CE93D8", // Material 粉紫
        "#E1BEE7", // Material 極淡紫
        "#F8BBD0", // 粉紅紫
        "#F3F0FF", // 幾乎白的紫
      ],
    },
  });
};

//3 切換chart格式 (chart title will link to chart data)

document.querySelector(".changeChartBtn").addEventListener("click", (e) => {
  e.preventDefault();
  if (chartTitle.textContent === "全分類營收比重") {
    chartTitle.textContent = "全品項營收比重";
  } else if (chartTitle.textContent === "全品項營收比重") {
    chartTitle.textContent = "全分類營收比重";
  }
  renderChart(
    chartTitle.textContent === "全分類營收比重" ? catChart : itemChart
  );
});

// error message notification
const errorMsg = (message) => {
  Swal.fire({
    position: "bottom-end",
    icon: "warn",
    title: message,
    showConfirmButton: false,
    timer: 1500,
  });
};

const init = () => {
  getCart();
  delAllBtn();
};

init();

import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  Coffee,
  Utensils,
  ClipboardList,
  BookOpen,
  PlusCircle,
  Trash2,
  User,
  Sun,
  Cloud,
  CloudRain,
  ShoppingBag,
  Home,
  ChefHat,
  History,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Receipt,
  AlertTriangle,
  Settings,
  Edit2,
  X,
  RefreshCw,
  Wallet,
  PiggyBank,
  Lock,
  Loader2,
  Landmark,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  ArrowRightCircle,
  BarChart3,
  Download,
  Plus,
  CalendarDays,
  CheckCircle2,
  Store,
  Zap,
  Package,
  Save,
} from "lucide-react";

// --- Firebase Initialization ---

let firebaseConfig;
let appId = "lantana_store_v1";
let isGeminiEnv = false;

try {
  if (typeof __firebase_config !== "undefined") {
    firebaseConfig = JSON.parse(__firebase_config);
    if (typeof __app_id !== "undefined") appId = __app_id;
    isGeminiEnv = true;
  }
} catch (e) {
  console.log("Using manual config");
}

if (!firebaseConfig) {
  firebaseConfig = {
    apiKey: "AIzaSyD_0rHXb4wH9qQMtnTPdjoPapLijt0Zc8E",
    authDomain: "lantana-cafe-app.firebaseapp.com",
    projectId: "lantana-cafe-app",
    storageBucket: "lantana-cafe-app.firebasestorage.app",
    messagingSenderId: "723885922436",
    appId: "1:723885922436:web:0714741658799d30138ad1",
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Initial Data ---
const INITIAL_MENU_ITEMS = [
  {
    name: "牛スジと野菜ピュレのカレー",
    basePrice: 1000,
    type: "food",
    hasSets: true,
    priceSetA: 1300,
    priceSetB: 1700,
    canTakeout: true,
    imageColor: "bg-amber-100",
    options: [
      { label: "ルー大盛", price: 100 },
      { label: "ご飯大盛", price: 100 },
    ],
  },
  {
    name: "ほうとう",
    basePrice: 1000,
    type: "food",
    hasSets: true,
    priceSetA: 1300,
    priceSetB: 1700,
    canTakeout: false,
    imageColor: "bg-orange-100",
    options: [],
  },
  {
    name: "かぼちゃのポタージュ",
    basePrice: 900,
    type: "food",
    hasSets: true,
    priceSetA: 1200,
    priceSetB: 1600,
    canTakeout: false,
    imageColor: "bg-yellow-100",
    options: [],
  },
  {
    name: "よくばりセット",
    basePrice: 2000,
    type: "food",
    hasSets: false,
    canTakeout: false,
    imageColor: "bg-red-100",
    options: [],
  },
  {
    name: "COLDドリンク",
    basePrice: 400,
    type: "drink",
    hasSets: false,
    canTakeout: true,
    imageColor: "bg-blue-50",
    options: [],
  },
  {
    name: "HOTドリンク",
    basePrice: 400,
    type: "drink",
    hasSets: false,
    canTakeout: true,
    imageColor: "bg-red-50",
    options: [],
  },
  {
    name: "おおまさりのお汁粉",
    basePrice: 500,
    type: "dessert",
    hasSets: true,
    priceDessertSet: 800,
    canTakeout: false,
    imageColor: "bg-stone-100",
    options: [],
  },
  {
    name: "フルーツのコンポートゼリー",
    basePrice: 500,
    type: "dessert",
    hasSets: true,
    priceDessertSet: 800,
    canTakeout: false,
    imageColor: "bg-pink-100",
    options: [],
  },
  {
    name: "ルバーブのクランブルサンデー",
    basePrice: 500,
    type: "dessert",
    hasSets: true,
    priceDessertSet: 800,
    canTakeout: false,
    imageColor: "bg-rose-100",
    options: [],
  },
  {
    name: "自家製アイス各種",
    basePrice: 400,
    type: "dessert",
    hasSets: false,
    canTakeout: false,
    imageColor: "bg-cyan-50",
    options: [],
  },
];

const SET_OPTIONS = {
  single: { label: "単品" },
  setA: { label: "A set (+ドリンク)" },
  setB: { label: "B set (+ドリンク・デザート)" },
  setDessert: { label: "デザートセット (+ドリンク)" },
};

// --- Helper Components ---
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  onClick,
  variant = "primary",
  className = "",
  children,
  disabled = false,
  type = "button",
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-md",
    secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200",
    outline: "border-2 border-orange-600 text-orange-600 hover:bg-orange-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-md",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${baseStyle} ${variants[variant]} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
};

// --- Month Navigator Component ---
const MonthNavigator = ({ currentMonth, onChange }) => (
  <div className="flex items-center justify-between bg-orange-50 p-2 rounded-xl border border-orange-200 mb-4 shadow-sm">
    <button
      onClick={() => onChange(-1)}
      className="p-3 bg-white text-orange-600 rounded-lg shadow-sm hover:bg-orange-100 active:scale-95 transition-all border border-orange-100"
    >
      <ChevronLeft size={24} />
    </button>
    <div className="flex flex-col items-center">
      <span className="text-xs text-orange-600 font-bold">対象月</span>
      <span className="font-bold text-xl text-stone-800 tracking-tight">
        {currentMonth.split("-")[0]}年 {currentMonth.split("-")[1]}月
      </span>
    </div>
    <button
      onClick={() => onChange(1)}
      className="p-3 bg-white text-orange-600 rounded-lg shadow-sm hover:bg-orange-100 active:scale-95 transition-all border border-orange-100"
    >
      <ChevronRight size={24} />
    </button>
  </div>
);

// --- Main Application Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [activeTab, setActiveTab] = useState("pos");
  const [staffName, setStaffName] = useState("高橋");
  const [expandedDate, setExpandedDate] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("起動中...");
  const [showRetry, setShowRetry] = useState(false);

  const [manualSalary, setManualSalary] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [analysisPeriod, setAnalysisPeriod] = useState("week");
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [isTakeoutMode, setIsTakeoutMode] = useState(false);
  const [expenseType, setExpenseType] = useState("expense");

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [editingOptions, setEditingOptions] = useState([]);

  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reports, setReports] = useState([]);
  const [funds, setFunds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  const [editingFund, setEditingFund] = useState(null);

  // Set initial editing options when opening menu editor
  useEffect(() => {
    if (editingMenu && editingMenu.options) {
      setEditingOptions(editingMenu.options);
    } else {
      setEditingOptions([]);
    }
  }, [editingMenu]);

  useEffect(() => {
    // 処理なし
  }, [selectedItem]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);

    const iconUrl =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23ea580c'/%3E%3Ctext x='50' y='70' font-size='50' text-anchor='middle' fill='white'%3E☕️%3C/text%3E%3C/svg%3E";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = iconUrl;

    let meta = document.querySelector(
      "meta[name='apple-mobile-web-app-capable']"
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "apple-mobile-web-app-capable";
      document.head.appendChild(meta);
    }
    meta.content = "yes";

    const timer = setTimeout(() => setShowRetry(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const getPrice = (item, setType) => {
    if (setType === "single") return item.basePrice;
    if (setType === "setA") return item.priceSetA || item.basePrice + 300;
    if (setType === "setB") return item.priceSetB || item.basePrice + 700;
    if (setType === "setDessert")
      return item.priceDessertSet || item.basePrice + 300;
    return item.basePrice;
  };

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoadingStatus("認証サーバーに接続中...");
        if (isGeminiEnv && typeof __initial_auth_token !== "undefined") {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        setLoadingStatus("データの読み込み準備中...");
      } catch (err) {
        console.error("Auth Error:", err);
        setAuthError(err.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const handleError = (err) => {
      if (err.code === "permission-denied" && !isGeminiEnv)
        setPermissionError(true);
    };

    const qMenu = query(
      collection(db, "artifacts", appId, "public", "data", "menu_items")
    );
    const unsubMenu = onSnapshot(
      qMenu,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        items.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setMenuItems(items);
      },
      handleError
    );

    const qOrders = query(
      collection(db, "artifacts", appId, "public", "data", "orders")
    );
    const unsubOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setOrders(data);
      },
      handleError
    );

    const qExpenses = query(
      collection(db, "artifacts", appId, "public", "data", "expenses")
    );
    const unsubExpenses = onSnapshot(
      qExpenses,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => b.date.localeCompare(a.date));
        setExpenses(data);
      },
      handleError
    );

    const qReports = query(
      collection(db, "artifacts", appId, "public", "data", "reports")
    );
    const unsubReports = onSnapshot(
      qReports,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => b.date.localeCompare(a.date));
        setReports(data);
      },
      handleError
    );

    const qFunds = query(
      collection(db, "artifacts", appId, "public", "data", "funds")
    );
    const unsubFunds = onSnapshot(
      qFunds,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        setFunds(data);
      },
      handleError
    );

    return () => {
      unsubMenu();
      unsubOrders();
      unsubExpenses();
      unsubReports();
      unsubFunds();
    };
  }, [user]);

  // --- Logic Helpers ---
  const confirmDelete = (e, collectionName, id, message) => {
    e.stopPropagation();
    setDeleteModal({ collection: collectionName, id: id, message: message });
  };

  const executeDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          deleteModal.collection,
          deleteModal.id
        )
      );
      setDeleteModal(null);
    } catch (err) {
      alert("削除に失敗しました: " + err.message);
    }
  };

  const fixPastOrdersToTakeout = async (targetName) => {
    if (
      !window.confirm(
        `「${targetName}」が含まれる過去の注文を、\nすべて「テイクアウト（8%）」に修正しますか？\n\n※この操作は取り消せません。`
      )
    )
      return;

    setLoadingStatus("データ修正中...");
    try {
      const q = query(
        collection(db, "artifacts", appId, "public", "data", "orders")
      );
      const querySnapshot = await getDocs(q);

      let updateCount = 0;
      const batch = writeBatch(db);

      querySnapshot.forEach((docSnap) => {
        const order = docSnap.data();
        let isModified = false;

        if (!order.items) return;

        const updatedItems = order.items.map((item) => {
          if (item.name === targetName && !item.isTakeout) {
            isModified = true;
            return { ...item, isTakeout: true };
          }
          return item;
        });

        if (isModified) {
          const docRef = doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "orders",
            docSnap.id
          );
          batch.update(docRef, { items: updatedItems });
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        alert(
          `${updateCount}件の注文データを修正しました！\n税金計算が自動的に再計算されます。`
        );
      } else {
        alert("修正が必要なデータはありませんでした。");
      }
    } catch (e) {
      console.error(e);
      alert("修正に失敗しました: " + e.message);
    } finally {
      setLoadingStatus("起動中...");
    }
  };

  const transferToFunds = async (amount, typeName) => {
    if (amount <= 0) return;
    if (
      !window.confirm(
        `${typeName} ¥${amount.toLocaleString()} を\n「資金（ランタナ預かり金）」に移動しますか？`
      )
    )
      return;

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "funds"),
        {
          date: new Date().toISOString().split("T")[0],
          amount: amount,
          type: "入金",
          note: `${currentMonth}分 ${typeName}繰入`,
          createdAt: serverTimestamp(),
        }
      );
      alert("資金に移動しました！");
    } catch (err) {
      console.error(err);
      alert("移動に失敗しました");
    }
  };

  const updateFund = async (e) => {
    e.preventDefault();
    if (!editingFund) return;

    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "funds", editingFund.id),
        {
          date: editingFund.date,
          amount: Number(editingFund.amount),
          type: editingFund.type,
          note: editingFund.note,
        }
      );
      setEditingFund(null);
      alert("履歴を更新しました！");
    } catch (err) {
      console.error(err);
      alert("更新に失敗しました: " + err.message);
    }
  };

  const recordSalaryAsExpense = async (salaryPerPerson) => {
    if (salaryPerPerson <= 0) return;
    if (
      !window.confirm(
        `高橋さん、浜田さんに\nそれぞれ ¥${salaryPerPerson.toLocaleString()} の給料を記録しますか？\n（経費として保存されます）`
      )
    )
      return;

    const today = new Date().toISOString().split("T")[0];
    const monthLabel = currentMonth.split("-")[1];

    try {
      const batch = writeBatch(db);

      const docRef1 = doc(
        collection(db, "artifacts", appId, "public", "data", "expenses")
      );
      batch.set(docRef1, {
        date: today,
        item: `${monthLabel}月分給料`,
        amount: salaryPerPerson,
        payer: "ランタナ",
        category: "給料分配",
        createdAt: serverTimestamp(),
      });

      const docRef2 = doc(
        collection(db, "artifacts", appId, "public", "data", "expenses")
      );
      batch.set(docRef2, {
        date: today,
        item: `${monthLabel}月分給料`,
        amount: salaryPerPerson,
        payer: "ランタナ",
        category: "給料分配",
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      alert("給料を経費（給料分配）として記録しました！");
    } catch (err) {
      console.error(err);
      alert("記録に失敗しました: " + err.message);
    }
  };

  const downloadCSV = () => {
    const header =
      "日付,売上合計(税込),税対象(10%),税対象(8%),経費合計,高橋払,浜田払,ランタナ払,収支,メモ\n";
    const rows = aggregated.daily
      .map((row) => {
        const profit = row.sales - row.expenses;
        return `${row.date},${row.sales},${row.sales10},${row.sales8},${row.expenses},${row.takahashiPay},${row.hamadaPay},${row.lantanaPay},${profit},`;
      })
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lantana_data_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveMenuItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      basePrice: Number(formData.get("basePrice")),
      type: formData.get("type"),
      hasSets: formData.get("hasSets") === "on",
      priceSetA: formData.get("priceSetA")
        ? Number(formData.get("priceSetA"))
        : null,
      priceSetB: formData.get("priceSetB")
        ? Number(formData.get("priceSetB"))
        : null,
      priceDessertSet: formData.get("priceDessertSet")
        ? Number(formData.get("priceDessertSet"))
        : null,
      canTakeout: formData.get("canTakeout") === "on",
      // ★追加：テイクアウト専門フラグ
      isTakeoutOnly: formData.get("isTakeoutOnly") === "on",
      imageColor: formData.get("imageColor"),
      options: editingOptions,
    };
    if (!data.imageColor) {
      if (data.type === "food") data.imageColor = "bg-orange-100";
      if (data.type === "drink") data.imageColor = "bg-blue-50";
      if (data.type === "dessert") data.imageColor = "bg-pink-100";
    }
    if (data.isTakeoutOnly) {
      data.canTakeout = true;
    }

    try {
      if (editingMenu?.id && !editingMenu.id.startsWith("init-")) {
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "menu_items",
            editingMenu.id
          ),
          data
        );
      } else {
        await addDoc(
          collection(db, "artifacts", appId, "public", "data", "menu_items"),
          { ...data, createdAt: serverTimestamp() }
        );
      }
      setEditingMenu(null);
      alert("メニューを保存しました！");
    } catch (err) {
      alert("エラー: " + err.message);
    }
  };

  const deleteMenuItem = async (id) => {
    if (id.startsWith("init-")) {
      alert("初期データは削除できません");
      return;
    }
    if (confirm("本当に削除しますか？")) {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "menu_items", id)
      );
    }
  };

  const addToCart = (item, setType = "single") => {
    const base = getPrice(item, setType);
    let optionPrice = 0;
    const optionLabels = [];
    selectedOptions.forEach((opt) => {
      optionPrice += opt.price;
      optionLabels.push(opt.label);
    });

    const price = base + optionPrice;

    // ★ここがポイント：商品が「テイクアウト専門」なら強制的にテイクアウト扱いにする
    const isTakeout = item.isTakeoutOnly || isTakeoutMode;

    const newItem = {
      tempId: Date.now(),
      itemId: item.id,
      name: item.name,
      setType: setType,
      setLabel: SET_OPTIONS[setType]?.label || "",
      isTakeout: isTakeout,
      price: price,
      options: optionLabels,
    };
    setCart([...cart, newItem]);
    setSelectedItem(null);
    setSelectedOptions([]);
  };
  const removeFromCart = (tempId) =>
    setCart(cart.filter((c) => c.tempId !== tempId));
  const calculateTotal = () => cart.reduce((sum, item) => sum + item.price, 0);
  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    const orderData = {
      items: cart,
      total: calculateTotal(),
      createdAt: serverTimestamp(),
      date: orderDate,
      staff: staffName,
      status: "completed",
    };
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "orders"),
        orderData
      );
      setCart([]);
      setIsCheckoutModalOpen(false);
    } catch (error) {
      alert("保存失敗: " + error.message);
    }
  };

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    item: "",
    amount: "",
    payer: "高橋",
    category: "仕入",
  });
  const submitExpense = async (e) => {
    e.preventDefault();
    if (!user || !expenseForm.amount) return;
    const finalAmount =
      expenseType === "refund"
        ? -Math.abs(Number(expenseForm.amount))
        : Math.abs(Number(expenseForm.amount));

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "expenses"),
        {
          ...expenseForm,
          amount: finalAmount,
          createdAt: serverTimestamp(),
        }
      );
      setExpenseForm({ ...expenseForm, item: "", amount: "" });
      setExpenseType("expense");
    } catch (err) {
      console.error(err);
    }
  };

  const [reportForm, setReportForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weather: "晴れ",
    customerCount: "",
    note: "",
  });
  const submitReport = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "reports"),
        {
          ...reportForm,
          customerCount: Number(reportForm.customerCount),
          createdAt: serverTimestamp(),
        }
      );
      alert("日報を保存しました");
      setReportForm({ ...reportForm, note: "", customerCount: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const [fundForm, setFundForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    type: "入金",
    note: "",
  });
  const submitFund = async (e) => {
    e.preventDefault();
    if (!user || !fundForm.amount) return;
    const isIncome = fundForm.type === "入金" || fundForm.type === "初期残高";
    const amountVal = Number(fundForm.amount);
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "funds"),
        {
          ...fundForm,
          amount: isIncome ? amountVal : -amountVal,
          createdAt: serverTimestamp(),
        }
      );
      setFundForm({ ...fundForm, amount: "", note: "" });
      alert("記録しました");
    } catch (err) {
      console.error(err);
    }
  };

  const changeMonth = (offset) => {
    const d = new Date(currentMonth + "-01");
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(d.toISOString().slice(0, 7));
    setManualSalary(null);
  };

  const getMenuRanking = (orders) => {
    const counts = {};
    orders.forEach((order) => {
      if (order.items)
        order.items.forEach((item) => {
          counts[item.name] = (counts[item.name] || 0) + 1;
        });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getAggregatedData = () => {
    const dataByDate = {};
    let totalSalesAll = 0;
    let totalExpensesAll = 0;
    let totalTax10Sales = 0;
    let totalTax8Sales = 0;

    let totalTakahashiPay = 0;
    let totalHamadaPay = 0;
    let totalLantanaPay = 0;

    const targetOrders = orders.filter((o) => o.date.startsWith(currentMonth));
    const targetExpenses = expenses.filter((e) =>
      e.date.startsWith(currentMonth)
    );

    targetOrders.forEach((order) => {
      const d = order.date;
      if (!dataByDate[d])
        dataByDate[d] = {
          date: d,
          sales: 0,
          sales10: 0,
          sales8: 0,
          expenses: 0,
          takahashiPay: 0,
          hamadaPay: 0,
          lantanaPay: 0,
          cashPay: 0,
          itemCounts: {},
          orderCount: 0,
          expenseDetails: [],
          rawOrders: [],
        };

      dataByDate[d].sales += order.total;
      totalSalesAll += order.total;
      dataByDate[d].orderCount += 1;
      dataByDate[d].rawOrders.push(order);

      if (order.items)
        order.items.forEach((item) => {
          const key =
            item.name +
            (item.setType !== "single" ? ` (${item.setLabel})` : "");
          if (!dataByDate[d].itemCounts[key])
            dataByDate[d].itemCounts[key] = {
              count: 0,
              amount: 0,
              isTakeout: item.isTakeout,
            };
          dataByDate[d].itemCounts[key].count += 1;
          dataByDate[d].itemCounts[key].amount += item.price;

          if (item.isTakeout) {
            dataByDate[d].sales8 += item.price;
            totalTax8Sales += item.price;
          } else {
            dataByDate[d].sales10 += item.price;
            totalTax10Sales += item.price;
          }
        });
    });

    targetExpenses.forEach((exp) => {
      const d = exp.date;
      if (!dataByDate[d])
        dataByDate[d] = {
          date: d,
          sales: 0,
          sales10: 0,
          sales8: 0,
          expenses: 0,
          takahashiPay: 0,
          hamadaPay: 0,
          lantanaPay: 0,
          cashPay: 0,
          itemCounts: {},
          orderCount: 0,
          expenseDetails: [],
          rawOrders: [],
        };

      dataByDate[d].expenses += exp.amount;
      dataByDate[d].expenseDetails.push(exp);

      if (exp.category !== "給料分配") {
        totalExpensesAll += exp.amount;
        if (exp.payer === "高橋") totalTakahashiPay += exp.amount;
        if (exp.payer === "浜田") totalHamadaPay += exp.amount;
        if (exp.payer === "ランタナ") totalLantanaPay += exp.amount;
      }

      if (exp.payer === "高橋") dataByDate[d].takahashiPay += exp.amount;
      if (exp.payer === "浜田") dataByDate[d].hamadaPay += exp.amount;
      if (exp.payer === "ランタナ") dataByDate[d].lantanaPay += exp.amount;
    });

    const sortedData = Object.values(dataByDate).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    const tax8 = Math.floor((totalTax8Sales / 1.08) * 0.08);
    const tax10 = Math.floor((totalTax10Sales / 1.1) * 0.1);
    const totalTax = tax8 + tax10;

    const profitBeforeTax = totalSalesAll - totalExpensesAll;
    const profitAfterTax = profitBeforeTax - totalTax;

    const baseProfit = Math.max(0, profitAfterTax);

    const defaultSalaryPerPerson = Math.floor(baseProfit / 2 / 1000) * 1000;
    const finalSalaryPerPerson =
      manualSalary !== null ? manualSalary : defaultSalaryPerPerson;

    const lantanaSavings = profitBeforeTax - finalSalaryPerPerson * 2;

    const transferredLantanaSavings = funds
      .filter(
        (f) =>
          f.date.startsWith(currentMonth) &&
          f.type === "入金" &&
          f.note.includes("端数")
      )
      .reduce((sum, f) => sum + f.amount, 0);

    const transferredTax = funds
      .filter(
        (f) =>
          f.date.startsWith(currentMonth) &&
          f.type === "入金" &&
          f.note.includes("税金")
      )
      .reduce((sum, f) => sum + f.amount, 0);

    const savingOnly = lantanaSavings - totalTax;

    const remainingLantanaSavings = savingOnly - transferredLantanaSavings;
    const remainingTax = totalTax - transferredTax;

    const totalFundsAdded = funds.reduce((sum, f) => sum + f.amount, 0);
    const totalLantanaExpenses = expenses
      .filter((e) => e.payer === "ランタナ")
      .reduce((sum, e) => sum + e.amount, 0);
    const currentFundBalance = totalFundsAdded - totalLantanaExpenses;

    const totalNetSales = totalSalesAll - totalTax;

    const totalTaxFund = funds
      .filter((f) => f.note.includes("税金"))
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      daily: sortedData,
      summary: {
        totalSales: totalSalesAll,
        totalExpenses: totalExpensesAll,
        totalTakahashiPay,
        totalHamadaPay,
        totalLantanaPay,
        profit: profitBeforeTax,
        salaryPerPerson: finalSalaryPerPerson,
        defaultSalaryPerPerson,
        lantanaSavings: savingOnly, // 純粋な端数貯金
        remainingLantanaSavings,
        remainingTax,
        transferredLantanaSavings,
        transferredTax,
        totalTax,
        tax8,
        tax10,
        totalNetSales,
      },
      fundBalance: currentFundBalance,
      totalFundsAdded,
      totalLantanaExpenses,
      totalTaxFund,
      menuRanking: getMenuRanking(targetOrders),
    };
  };

  const aggregated = useMemo(
    () => getAggregatedData(),
    [orders, expenses, funds, manualSalary, currentMonth]
  );

  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];

    if (analysisPeriod === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const val = orders
          .filter((o) => o.date === dateStr)
          .reduce((s, o) => s + o.total, 0);
        data.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          value: val,
          fullDate: dateStr,
        });
      }
    } else if (analysisPeriod === "month") {
      const [y, m] = currentMonth.split("-");
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(
          i
        ).padStart(2, "0")}`;
        const val = orders
          .filter((o) => o.date === dateStr)
          .reduce((s, o) => s + o.total, 0);
        data.push({ label: `${i}`, value: val, fullDate: dateStr });
      }
    } else if (analysisPeriod === "year") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthlySales = orders
          .filter((o) => o.date.startsWith(monthStr))
          .reduce((s, o) => s + o.total, 0);
        data.push({
          label: `${d.getMonth() + 1}月`,
          value: monthlySales,
          yearMonth: monthStr,
        });
      }
    }
    return data;
  }, [analysisPeriod, currentMonth, orders]);

  // --- Render Functions ---
  // すべてのRender関数をここ（returnより前）に定義します

  const renderAnalysis = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
        <TrendingUp className="text-orange-600" /> 経営分析
      </h2>
      <div className="flex bg-stone-100 p-1 rounded-lg mb-4">
        {["week", "month", "year"].map((p) => (
          <button
            key={p}
            onClick={() => setAnalysisPeriod(p)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              analysisPeriod === p
                ? "bg-white shadow text-orange-600"
                : "text-stone-400"
            }`}
          >
            {p === "week"
              ? "直近1週"
              : p === "month"
              ? `${currentMonth.split("-")[1]}月`
              : "年間"}
          </button>
        ))}
      </div>
      {analysisPeriod === "month" && (
        <MonthNavigator currentMonth={currentMonth} onChange={changeMonth} />
      )}
      <Card className="p-4">
        <h3 className="font-bold text-stone-600 mb-4 flex items-center gap-2 text-sm">
          <BarChart3 size={16} /> 売上推移
        </h3>
        <div className="w-full overflow-x-auto">
          <div
            className={`h-40 flex items-end gap-2 px-2 ${
              analysisPeriod === "month"
                ? "min-w-[500px]"
                : "w-full justify-between"
            }`}
          >
            {chartData.map((d, i) => {
              const maxVal = Math.max(...chartData.map((d) => d.value), 1000);
              const height = `${Math.max((d.value / maxVal) * 100, 2)}%`;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center flex-1 group min-w-[20px]"
                >
                  <div
                    className="w-full bg-orange-100 rounded-t-md relative hover:bg-orange-200 transition-all group"
                    style={{ height }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-stone-800 text-white px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      ¥{d.value.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[9px] text-stone-400 mt-1 whitespace-nowrap">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-bold text-stone-600 mb-4 flex items-center gap-2 text-sm">
          <Coffee size={16} /> 人気メニュー TOP5 ({currentMonth})
        </h3>
        <div className="space-y-3">
          {aggregated.menuRanking.map(([name, count], i) => (
            <div key={name} className="flex items-center gap-3">
              <span
                className={`text-xs font-bold w-4 text-center ${
                  i < 3 ? "text-orange-500" : "text-stone-400"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-700">{name}</span>
                  <span className="text-stone-500">{count}食</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400"
                    style={{
                      width: `${(count / aggregated.menuRanking[0][1]) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderFunds = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6 text-center shadow-sm">
        <h3 className="text-stone-500 font-bold mb-2 flex items-center justify-center gap-2">
          <Landmark size={20} className="text-green-600" /> ランタナ預り金残高
        </h3>
        <div className="text-4xl font-mono font-bold text-green-700">
          ¥{aggregated.fundBalance.toLocaleString()}
        </div>
        <div className="mt-4 pt-3 border-t border-green-200 text-xs text-stone-500">
          <div className="flex justify-between items-center mb-1">
            <span>うち 税金積立累計</span>
            <span className="font-bold text-red-500">
              ¥{aggregated.totalTaxFund.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>実質残高 (税抜)</span>
            <span className="font-bold text-stone-700">
              ¥
              {(
                aggregated.fundBalance - aggregated.totalTaxFund
              ).toLocaleString()}
            </span>
          </div>

          <div className="text-xs text-stone-400 mt-2 border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>資金移動計 (＋)</span>
              <span>¥{aggregated.totalFundsAdded.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>経費支払(ランタナ) (－)</span>
              <span className="text-red-500">
                ¥{aggregated.totalLantanaExpenses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
          <RefreshCw className="text-orange-600" /> 資金の移動を記録
        </h2>
        <form onSubmit={submitFund} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">
                日付
              </label>
              <input
                type="date"
                required
                value={fundForm.date}
                onChange={(e) =>
                  setFundForm({ ...fundForm, date: e.target.value })
                }
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">
                区分
              </label>
              <select
                value={fundForm.type}
                onChange={(e) =>
                  setFundForm({ ...fundForm, type: e.target.value })
                }
                className="w-full p-2 border border-stone-300 rounded-lg bg-white"
              >
                <option>入金</option>
                <option>出金</option>
                <option>初期残高</option>
              </select>
            </div>
          </div>
          <input
            type="number"
            required
            placeholder="金額"
            value={fundForm.amount}
            onChange={(e) =>
              setFundForm({ ...fundForm, amount: e.target.value })
            }
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="メモ"
            value={fundForm.note}
            onChange={(e) => setFundForm({ ...fundForm, note: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <Button type="submit">記録</Button>
        </form>
      </Card>
      <div className="space-y-2">
        {funds.map((f) => (
          <div
            key={f.id}
            className="flex justify-between p-3 bg-white border rounded items-center"
          >
            <div>
              <span className="text-xs text-gray-500 block">{f.date}</span>
              <span className="text-sm font-bold">{f.note}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold ${
                  f.amount >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {f.amount >= 0 ? "+" : ""}¥{Number(f.amount).toLocaleString()}
              </span>
              <button
                onClick={() => setEditingFund(f)}
                className="text-stone-400 hover:text-orange-600"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => confirmDelete(e, "funds", f.id, "削除?")}
                className="text-stone-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 資金履歴編集モーダル */}
      {editingFund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h3 className="font-bold mb-4">履歴を修正</h3>
            <form onSubmit={updateFund} className="space-y-4">
              <input
                type="date"
                value={editingFund.date}
                onChange={(e) =>
                  setEditingFund({ ...editingFund, date: e.target.value })
                }
                className="border p-2 w-full rounded"
              />
              <select
                value={editingFund.type}
                onChange={(e) =>
                  setEditingFund({ ...editingFund, type: e.target.value })
                }
                className="border p-2 w-full rounded"
              >
                <option>入金</option>
                <option>出金</option>
              </select>
              <input
                type="number"
                value={editingFund.amount}
                onChange={(e) =>
                  setEditingFund({ ...editingFund, amount: e.target.value })
                }
                className="border p-2 w-full rounded"
              />
              <input
                type="text"
                value={editingFund.note}
                onChange={(e) =>
                  setEditingFund({ ...editingFund, note: e.target.value })
                }
                className="border p-2 w-full rounded"
                placeholder="メモ (例: 税金積立)"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setEditingFund(null)}
                >
                  キャンセル
                </Button>
                <Button type="submit">更新</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderMenuSettings = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between mb-4">
        <h2 className="font-bold">メニュー管理</h2>
        <Button onClick={() => setEditingMenu({})}>新規追加</Button>
      </div>
      <div className="space-y-2">
        {menuItems.map((m) => (
          <div
            key={m.id}
            className="flex justify-between p-3 bg-white border rounded items-center"
          >
            <div>{m.name}</div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => fixPastOrdersToTakeout(m.name)}
                className="p-2 text-yellow-500 hover:text-yellow-600 bg-yellow-50 rounded-lg"
              >
                <Zap size={16} />
              </button>
              <button
                onClick={() => setEditingMenu(m)}
                className="p-2 text-stone-400 hover:text-orange-600"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => deleteMenuItem(m.id)}
                className="p-2 text-stone-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {editingMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md h-[90vh] overflow-y-auto">
            <h3 className="font-bold mb-4">メニュー編集</h3>
            <form onSubmit={saveMenuItem} className="space-y-4">
              <input
                name="name"
                defaultValue={editingMenu.name}
                placeholder="名前"
                className="border p-2 w-full rounded"
                required
              />
              <input
                name="basePrice"
                type="number"
                defaultValue={editingMenu.basePrice}
                placeholder="価格"
                className="border p-2 w-full rounded"
                required
              />

              {/* オプション設定フォーム */}
              <div className="border-t pt-4">
                <label className="text-sm font-bold">オプション設定</label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingOptions([
                      ...editingOptions,
                      { label: "", price: 0 },
                    ])
                  }
                  className="text-xs bg-gray-100 px-2 py-1 ml-2 rounded"
                >
                  追加
                </button>
                {editingOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 mt-2">
                    <input
                      value={opt.label}
                      onChange={(e) => {
                        const n = [...editingOptions];
                        n[i].label = e.target.value;
                        setEditingOptions(n);
                      }}
                      className="border p-1 w-full rounded"
                      placeholder="名称(大盛など)"
                    />
                    <input
                      type="number"
                      value={opt.price}
                      onChange={(e) => {
                        const n = [...editingOptions];
                        n[i].price = Number(e.target.value);
                        setEditingOptions(n);
                      }}
                      className="border p-1 w-20 rounded"
                      placeholder="円"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOptions(
                          editingOptions.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {editingOptions.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">オプションなし</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    name="hasSets"
                    defaultChecked={editingMenu.hasSets}
                    className="w-4 h-4"
                  />
                  セット販売を有効にする
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    name="canTakeout"
                    defaultChecked={editingMenu.canTakeout}
                    className="w-4 h-4"
                  />
                  テイクアウト可能にする
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 p-2 rounded">
                  <input
                    type="checkbox"
                    name="isTakeoutOnly"
                    defaultChecked={editingMenu.isTakeoutOnly}
                    className="w-4 h-4"
                  />
                  テイクアウト専門にする (店内不可)
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setEditingMenu(null)}
                >
                  キャンセル
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-stone-700 flex items-center gap-2">
          <History className="text-orange-600" /> 帳簿
        </h2>
        <button
          onClick={downloadCSV}
          className="text-xs bg-white border p-2 rounded"
        >
          <Download size={14} />
        </button>
      </div>
      <MonthNavigator currentMonth={currentMonth} onChange={changeMonth} />

      {/* 1. 月間収支 */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
        <h3 className="font-bold text-stone-700 border-b pb-2 mb-2">
          1. 月間収支
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-stone-500 text-sm">売上合計 (税込)</span>
          <span className="font-mono text-lg font-bold">
            ¥{aggregated.summary.totalSales.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-stone-400 text-right mb-2">
          (10%: ¥
          {aggregated.daily
            .reduce((acc, d) => acc + d.sales10, 0)
            .toLocaleString()}{" "}
          / 8%: ¥
          {aggregated.daily
            .reduce((acc, d) => acc + d.sales8, 0)
            .toLocaleString()}
          )
        </div>
        <div className="flex justify-between items-center">
          <span className="text-stone-500 text-sm">経費合計 (給料除く)</span>
          <span className="font-mono text-lg font-bold text-red-500">
            -¥{aggregated.summary.totalExpenses.toLocaleString()}
          </span>
        </div>

        {/* ★追加: 経費の内訳（誰がいくら払ったか） */}
        <div className="mt-2 pt-2 border-t border-dashed border-stone-200 text-xs text-stone-500">
          <div className="flex justify-between">
            <span>高橋 立替</span>
            <span>
              ¥{aggregated.summary.totalTakahashiPay.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>浜田 立替</span>
            <span>¥{aggregated.summary.totalHamadaPay.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ランタナ払</span>
            <span>¥{aggregated.summary.totalLantanaPay.toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t pt-2 flex justify-between items-center bg-stone-50 p-2 rounded">
          <span className="font-bold text-stone-700">粗利益</span>
          <span className="font-mono text-xl font-bold">
            ¥{aggregated.summary.profit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. 税金と配分原資 */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
        <h3 className="font-bold text-stone-700 border-b pb-2 mb-2">
          2. 税金と配分原資
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-sm">消費税 (預り分)</span>
            {aggregated.summary.remainingTax > 0 ? (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                未移動: ¥{aggregated.summary.remainingTax.toLocaleString()}
              </span>
            ) : (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">
                移動完了
              </span>
            )}
          </div>
          <span className="font-mono text-lg font-bold">
            ¥{aggregated.summary.totalTax.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() =>
              transferToFunds(aggregated.summary.remainingTax, "税金積立")
            }
            className={`text-xs px-3 py-1 rounded-full border ${
              aggregated.summary.remainingTax > 0
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-stone-100 text-stone-400 border-stone-200"
            }`}
            disabled={aggregated.summary.remainingTax <= 0}
          >
            税金を資金へ移動
          </button>
        </div>

        <div className="border-t pt-2 flex justify-between items-center bg-blue-50 p-2 rounded">
          <span className="font-bold text-blue-800">配分原資 (税引後)</span>
          <span className="font-mono text-xl font-bold text-blue-900">
            ¥
            {(
              aggregated.summary.profit - aggregated.summary.totalTax
            ).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 3. 給料とお店の貯金 */}
      <div className="bg-white p-4 rounded-xl border-2 border-orange-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
          原資÷2 (千円未満切捨)
        </div>
        <h3 className="font-bold text-orange-800 border-b border-orange-100 pb-2 mb-3">
          3. 給料とお店の貯金
        </h3>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <User size={18} className="text-orange-600" />
              <span className="font-bold text-stone-700">給料 (1人あたり)</span>
            </div>
            <span className="font-mono text-2xl font-bold text-orange-600">
              ¥{aggregated.summary.salaryPerPerson.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={aggregated.summary.defaultSalaryPerPerson}
            step="1000"
            value={aggregated.summary.salaryPerPerson}
            onChange={(e) => setManualSalary(Number(e.target.value))}
            className="w-full accent-orange-600"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() =>
                recordSalaryAsExpense(aggregated.summary.salaryPerPerson)
              }
              className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-600 shadow-md flex items-center gap-1"
            >
              <CheckCircle2 size={12} /> 給料を確定して記録
            </button>
          </div>
        </div>

        <div className="border-t border-dashed border-stone-300 pt-3">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <PiggyBank size={18} className="text-green-600" />
              <span className="font-bold text-stone-700">
                お店の貯金 (端数)
              </span>
            </div>
            <span className="font-mono text-xl font-bold text-green-700">
              ¥{aggregated.summary.lantanaSavings.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-400">
              移動済み: ¥
              {aggregated.summary.transferredLantanaSavings.toLocaleString()}
            </span>
            <button
              onClick={() =>
                transferToFunds(
                  aggregated.summary.remainingLantanaSavings,
                  "端数貯金"
                )
              }
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                aggregated.summary.remainingLantanaSavings > 0
                  ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
              }`}
              disabled={aggregated.summary.remainingLantanaSavings <= 0}
            >
              <ArrowRightCircle size={12} /> 残額を移動
            </button>
          </div>
        </div>
      </div>

      {/* 日別リスト */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-100 font-bold">
              <tr>
                <th className="p-3">日付</th>
                <th className="p-3 text-right">売上</th>
                <th className="p-3 text-right">収支</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {aggregated.daily.map((row) => (
                <React.Fragment key={row.date}>
                  <tr
                    onClick={() =>
                      setExpandedDate(
                        expandedDate === row.date ? null : row.date
                      )
                    }
                    className="cursor-pointer hover:bg-stone-50"
                  >
                    <td className="p-3">{row.date.slice(8)}日</td>
                    <td className="p-3 text-right">
                      ¥{row.sales.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      ¥{(row.sales - row.expenses).toLocaleString()}
                    </td>
                  </tr>
                  {expandedDate === row.date && (
                    <tr className="bg-stone-50">
                      <td colSpan={3} className="p-4">
                        <div className="space-y-2">
                          {row.expenseDetails.map((e) => (
                            <div
                              key={e.id}
                              className="flex justify-between text-xs items-center"
                            >
                              <span className="flex-1">
                                {/* ★追加: 支払者バッジを表示 */}
                                <span
                                  className={`px-1 rounded text-[10px] mr-1 ${
                                    e.payer === "ランタナ"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-stone-200 text-stone-600"
                                  }`}
                                >
                                  {e.payer}
                                </span>
                                {e.item}
                              </span>
                              <span>
                                ¥{e.amount.toLocaleString()}{" "}
                                <button
                                  onClick={(ev) =>
                                    confirmDelete(ev, "expenses", e.id, "削除?")
                                  }
                                  className="ml-1 text-stone-400"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </span>
                            </div>
                          ))}
                          {row.rawOrders.map((o) => (
                            <div key={o.id} className="border-b pb-1 mb-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span>
                                  {new Date(
                                    o.createdAt?.seconds * 1000
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span>
                                  ¥{o.total}{" "}
                                  <button
                                    onClick={(ev) =>
                                      confirmDelete(ev, "orders", o.id, "削除?")
                                    }
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {/* 安全なオプション表示 */}
                                {o.items?.map((item, idx) => (
                                  <div key={idx}>
                                    {item.name}
                                    {item.options?.length > 0 &&
                                      ` [${
                                        Array.isArray(item.options)
                                          ? item.options
                                              .map((opt) =>
                                                typeof opt === "string"
                                                  ? opt
                                                  : opt.label
                                              )
                                              .join(", ")
                                          : ""
                                      }]`}
                                    {item.isTakeout ? " (To)" : ""}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPOS = () => (
    <div className="h-full flex flex-col md:flex-row gap-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
          <Utensils className="text-orange-600" /> メニュー
        </h2>

        {/* 日付変更エリア */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 mb-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-600 font-bold text-sm">
            <CalendarDays size={18} />
            <span>計上日:</span>
          </div>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-sm font-mono text-stone-700"
          />
        </div>

        {/* テイクアウト切り替えスイッチ */}
        <div className="flex bg-stone-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setIsTakeoutMode(false)}
            className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              !isTakeoutMode
                ? "bg-white text-orange-600 shadow"
                : "text-stone-400"
            }`}
          >
            <Home size={16} /> 店内 (10%)
          </button>
          <button
            onClick={() => setIsTakeoutMode(true)}
            className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              isTakeoutMode ? "bg-white text-blue-600 shadow" : "text-stone-400"
            }`}
          >
            <ShoppingBag size={16} /> テイクアウト (8%)
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.hasSets) {
                  setSelectedItem(item);
                } else {
                  addToCart(item, item.isFixedSet ? "setB" : "single", false);
                }
              }}
              // ★修正：canTakeoutが未設定（undefined）の場合も押せるようにする
              disabled={isTakeoutMode && item.canTakeout === false}
              className={`p-4 rounded-xl text-left transition-all active:scale-95 shadow-sm border border-stone-100 flex flex-col justify-between h-32 ${
                item.imageColor
              } ${
                isTakeoutMode && item.canTakeout === false
                  ? "opacity-30 cursor-not-allowed"
                  : ""
              } relative`}
            >
              {/* テイクアウト専門バッジ */}
              {item.isTakeoutOnly && (
                <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Package size={10} /> Takeout Only
                </span>
              )}
              <span className="font-bold text-stone-800 leading-tight">
                {item.name}
              </span>
              <span className="font-mono text-stone-600 bg-white/50 px-2 py-1 rounded w-fit text-sm">
                ¥{item.basePrice.toLocaleString()}~
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              setActiveTab("menu");
              setEditingMenu({});
            }}
            className="p-4 rounded-xl flex flex-col justify-center items-center h-32 border-2 border-dashed border-stone-300 text-stone-400 hover:bg-stone-50 hover:border-orange-300 hover:text-orange-500 transition-colors"
          >
            <PlusCircle size={24} />{" "}
            <span className="text-xs font-bold mt-2">メニュー追加</span>
          </button>
        </div>
      </div>
      <div className="md:w-80 bg-stone-50 border-t md:border-l border-stone-200 flex flex-col h-1/3 md:h-full fixed bottom-0 left-0 right-0 md:relative z-10 shadow-xl md:shadow-none">
        <div className="p-4 bg-orange-600 text-white flex justify-between items-center">
          <span className="font-bold flex items-center gap-2">
            <ShoppingBag size={18} /> 注文リスト
          </span>
          <span className="font-mono text-xl">
            ¥{calculateTotal().toLocaleString()}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50">
          {cart.length === 0 ? (
            <div className="text-stone-400 text-center py-8 text-sm">
              注文はまだありません
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.tempId}
                className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-start border border-stone-100"
              >
                <div>
                  <div className="font-bold text-stone-800 text-sm">
                    {item.name}
                  </div>
                  <div className="text-xs text-stone-500 flex gap-2 mt-1">
                    {item.setType !== "single" && (
                      <span className="bg-orange-100 text-orange-700 px-1 rounded">
                        {item.setLabel}
                      </span>
                    )}
                    {item.isTakeout ? (
                      <span className="bg-blue-100 text-blue-700 px-1 rounded flex items-center gap-1">
                        <ShoppingBag size={10} /> Takeout
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-1 rounded flex items-center gap-1">
                        <Home size={10} /> 店内
                      </span>
                    )}
                    {item.options && item.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.options.map((opt, i) => (
                          // 安全な表示（文字列またはオブジェクトに対応）
                          <span
                            key={i}
                            className="text-[10px] bg-stone-100 text-stone-500 px-1 rounded border border-stone-200"
                          >
                            {typeof opt === "string" ? opt : opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-sm">¥{item.price}</span>
                  <button
                    onClick={() => removeFromCart(item.tempId)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-white border-t border-stone-200">
          <Button
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full py-3 text-lg shadow-orange-200"
            disabled={cart.length === 0}
          >
            お会計へ進む
          </Button>
        </div>
      </div>
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div
              className={`p-4 ${selectedItem.imageColor} font-bold text-lg flex justify-between items-center`}
            >
              {selectedItem.name}{" "}
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 bg-white/50 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-bold text-stone-500 mb-2 block">
                  セットを選んでください
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      addToCart(selectedItem, "single", isTakeoutMode)
                    }
                    className="w-full text-left p-3 border rounded-lg hover:bg-stone-50 flex justify-between"
                  >
                    <span>単品</span>{" "}
                    <span className="font-mono">
                      ¥{getPrice(selectedItem, "single")}
                    </span>
                  </button>

                  {/* ★修正：セット販売が有効（hasSets=true）なら必ず表示（typeがなくても） */}
                  {(selectedItem.hasSets ||
                    (selectedItem.priceSetA && selectedItem.priceSetB)) && (
                    <>
                      <button
                        onClick={() =>
                          addToCart(selectedItem, "setA", isTakeoutMode)
                        }
                        className="w-full text-left p-3 border rounded-lg hover:bg-orange-50 border-orange-200 flex justify-between"
                      >
                        <div>
                          <span className="block font-bold text-orange-700">
                            A Set
                          </span>
                          <span className="text-xs text-stone-500">
                            お好きなドリンク
                          </span>
                        </div>
                        <span className="font-mono">
                          ¥{getPrice(selectedItem, "setA")}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          addToCart(selectedItem, "setB", isTakeoutMode)
                        }
                        className="w-full text-left p-3 border rounded-lg hover:bg-orange-50 border-orange-200 flex justify-between"
                      >
                        <div>
                          <span className="block font-bold text-orange-700">
                            B Set
                          </span>
                          <span className="text-xs text-stone-500">
                            ドリンク ＋ デザート
                          </span>
                        </div>
                        <span className="font-mono">
                          ¥{getPrice(selectedItem, "setB")}
                        </span>
                      </button>
                    </>
                  )}

                  {/* デザートセットも同様に表示 */}
                  {selectedItem.priceDessertSet && (
                    <button
                      onClick={() =>
                        addToCart(selectedItem, "setDessert", isTakeoutMode)
                      }
                      className="w-full text-left p-3 border rounded-lg hover:bg-pink-50 border-pink-200 flex justify-between"
                    >
                      <div>
                        <span className="block font-bold text-pink-700">
                          デザートセット
                        </span>
                        <span className="text-xs text-stone-500">
                          お好きなドリンク
                        </span>
                      </div>
                      <span className="font-mono">
                        ¥{getPrice(selectedItem, "setDessert")}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* オプション選択（大盛りなど） */}
              {selectedItem.options && selectedItem.options.length > 0 && (
                <div>
                  <label className="text-sm font-bold text-stone-500 mb-2 block">
                    オプション
                  </label>
                  <div className="space-y-2">
                    {selectedItem.options.map((opt, idx) => {
                      const isSelected = selectedOptions.some(
                        (o) => o.label === opt.label
                      );
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedOptions(
                                selectedOptions.filter(
                                  (o) => o.label !== opt.label
                                )
                              );
                            } else {
                              setSelectedOptions([...selectedOptions, opt]);
                            }
                          }}
                          className={`w-full text-left p-3 border rounded-lg flex justify-between items-center transition-colors ${
                            isSelected
                              ? "bg-orange-100 border-orange-300 text-orange-800"
                              : "hover:bg-stone-50 border-stone-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? "bg-orange-500 border-orange-500"
                                  : "border-stone-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span>{opt.label}</span>
                          </div>
                          <span className="font-mono">+¥{opt.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItem.canTakeout !== false && !isTakeoutMode && (
                <div className="pt-4 border-t border-stone-100">
                  <p className="text-xs text-center text-stone-400 mb-2">
                    単品でのテイクアウトはこちら
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => addToCart(selectedItem, "single", true)}
                  >
                    <ShoppingBag size={18} /> テイクアウト (単品)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-6">
            <h3 className="text-xl font-bold text-stone-800">お会計確定</h3>
            <div className="py-4 bg-stone-50 rounded-lg">
              <p className="text-sm text-stone-500">合計金額</p>
              <p className="text-4xl font-mono font-bold text-orange-600">
                ¥{calculateTotal().toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsCheckoutModalOpen(false)}
              >
                戻る
              </Button>
              <Button className="flex-1" onClick={handleCheckout}>
                確定する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExpenses = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
          <DollarSign className="text-orange-600" /> 経費の入力
        </h2>
        <form onSubmit={submitExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">
                日付
              </label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, date: e.target.value })
                }
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">
                金額
              </label>
              <input
                type="number"
                required
                placeholder="¥0"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                className="w-full p-2 border border-stone-300 rounded-lg font-mono text-right"
              />
              <p className="text-[10px] text-stone-400 text-right mt-1">
                ※返金の場合はマイナスを入力
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">
              支払った人（財布）
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["高橋", "浜田", "ランタナ"].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setExpenseForm({ ...expenseForm, payer: p })}
                  className={`p-2 rounded-lg text-sm border ${
                    expenseForm.payer === p
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-stone-600 border-stone-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">
              分類
            </label>
            <select
              value={expenseForm.category}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, category: e.target.value })
              }
              className="w-full p-2 border border-stone-300 rounded-lg bg-white"
            >
              <option>仕入</option>
              <option>消耗品</option>
              <option>人件費</option>
              <option>委託費</option>
              <option>給料分配</option>
              <option>その他</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">
              品目・詳細
            </label>
            <input
              type="text"
              placeholder="例：米、返金など"
              value={expenseForm.item}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, item: e.target.value })
              }
              className="w-full p-2 border border-stone-300 rounded-lg"
            />
          </div>
          <Button type="submit" className="w-full py-3 mt-4">
            <PlusCircle size={18} /> 経費を登録
          </Button>
        </form>
      </Card>
      <div className="space-y-3">
        <h3 className="font-bold text-stone-500 text-sm pl-2">最近の経費</h3>
        {expenses.slice(0, 5).map((exp) => (
          <div
            key={exp.id}
            className="bg-white p-3 rounded-lg border border-stone-200 flex justify-between items-center text-sm"
          >
            <div>
              <div className="font-bold text-stone-700">
                {exp.item || exp.category}
              </div>
              <div className="text-xs text-stone-400">
                {exp.date} / {exp.payer}払
              </div>
            </div>
            <div
              className={`font-mono font-bold ${
                exp.amount < 0 ? "text-blue-600" : "text-stone-600"
              }`}
            >
              ¥{Number(exp.amount).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
          <BookOpen className="text-orange-600" /> 今日の日報
        </h2>
        <form onSubmit={submitReport} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">
                日付
              </label>
              <input
                type="date"
                required
                value={reportForm.date}
                onChange={(e) =>
                  setReportForm({ ...reportForm, date: e.target.value })
                }
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">
                天気
              </label>
              <div className="flex bg-stone-100 rounded-lg p-1">
                {["晴れ", "曇り", "雨"].map((w) => (
                  <button
                    type="button"
                    key={w}
                    onClick={() => setReportForm({ ...reportForm, weather: w })}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-all ${
                      reportForm.weather === w
                        ? "bg-white shadow text-orange-600 font-bold"
                        : "text-stone-400"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">
              来店数（組/人）
            </label>
            <input
              type="number"
              value={reportForm.customerCount}
              onChange={(e) =>
                setReportForm({ ...reportForm, customerCount: e.target.value })
              }
              className="w-full p-2 border border-stone-300 rounded-lg"
              placeholder="人数を入力"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">
              業務メモ・日記
            </label>
            <textarea
              value={reportForm.note}
              onChange={(e) =>
                setReportForm({ ...reportForm, note: e.target.value })
              }
              className="w-full p-2 border border-stone-300 rounded-lg h-32"
              placeholder="試作の感想、お客様の様子など..."
            />
          </div>
          <Button type="submit" className="w-full">
            日報を保存
          </Button>
        </form>
      </Card>
      <div className="space-y-4">
        <h3 className="font-bold text-stone-500 pl-2">過去の日報</h3>
        {reports.length === 0 ? (
          <p className="text-center text-stone-400 py-8">
            まだ日報がありません
          </p>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-stone-700">
                    {report.date}
                  </span>
                  <span className="text-sm bg-stone-100 px-2 py-1 rounded text-stone-600">
                    {report.weather} / {report.customerCount}組
                  </span>
                </div>
                <button
                  onClick={(e) =>
                    confirmDelete(
                      e,
                      "reports",
                      report.id,
                      "この日報を削除しますか？"
                    )
                  }
                  className="p-2 bg-stone-100 rounded-lg text-stone-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-stone-600 text-sm whitespace-pre-wrap">
                {report.note}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  if (authError)
    return (
      <div className="h-screen flex items-center justify-center bg-red-50 text-red-600 p-8 text-center">
        <div>
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <h2 className="font-bold text-xl mb-2">認証エラー</h2>
          <p className="text-sm">{authError}</p>
          <p className="text-xs mt-4 text-stone-500">
            Firebaseコンソールの「Authentication」で
            <br />
            「匿名ログイン」が有効になっているか確認してください。
          </p>
        </div>
      </div>
    );
  if (permissionError && !isGeminiEnv)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-red-500" />
          </div>
          <h2 className="font-bold text-xl text-stone-800 mb-2">
            データベースの鍵がかかっています
          </h2>
          <p className="text-stone-500 text-sm mb-6">
            Firebaseのセキュリティルールを再設定し、
            <br />
            アプリを再起動してください。
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw size={18} /> 再読み込み
          </Button>
        </div>
      </div>
    );
  if (!user)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-stone-100 text-stone-400">
        <Loader2 className="animate-spin mb-2" size={32} />
        <span>{loadingStatus}</span>
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-blue-500 underline"
          >
            再読み込み
          </button>
        )}
      </div>
    );

  return (
    <div className="h-screen w-full bg-stone-100 text-stone-800 font-sans flex flex-col md:flex-row">
      <div className="bg-stone-800 text-white p-3 flex md:flex-col justify-between items-center md:w-20 md:h-full z-20 shadow-lg shrink-0">
        <div className="font-bold text-xl tracking-tighter text-orange-400 md:mb-6">
          <span className="md:hidden">畑Cafe</span>
          <span className="hidden md:block text-2xl">
            <ChefHat />
          </span>
        </div>
        <nav className="flex md:flex-col gap-1 md:gap-4 flex-1 justify-center md:justify-start w-full">
          {[
            { id: "pos", icon: Coffee, label: "注文" },
            { id: "expenses", icon: DollarSign, label: "経費" },
            { id: "report", icon: ClipboardList, label: "日報" },
            { id: "history", icon: TrendingUp, label: "帳簿" },
            { id: "funds", icon: Landmark, label: "資金" },
            { id: "menu", icon: Settings, label: "メニュー" },
            { id: "analysis", icon: TrendingUp, label: "分析" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-2 md:p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-900/50"
                  : "text-stone-400 hover:bg-stone-700 hover:text-stone-200"
              }`}
            >
              <tab.icon size={22} />
              <span className="text-[10px] md:text-xs font-bold">
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
        <button
          onClick={() => setStaffName(staffName === "高橋" ? "浜田" : "高橋")}
          className="md:mt-auto bg-stone-700 p-2 rounded-lg text-xs flex flex-col items-center gap-1 border border-stone-600"
        >
          <User size={16} />
          {staffName}
        </button>
      </div>
      <main className="flex-1 h-full overflow-hidden relative">
        <header className="h-14 bg-white border-b border-stone-200 flex items-center px-4 justify-between md:hidden">
          <span className="font-bold text-stone-700">
            {activeTab === "pos" && "注文入力"}
            {activeTab === "expenses" && "経費精算"}
            {activeTab === "report" && "日報・メモ"}
            {activeTab === "history" && "売上帳簿"}
            {activeTab === "funds" && "資金管理"}
            {activeTab === "menu" && "メニュー管理"}
            {activeTab === "analysis" && "経営分析"}
          </span>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
            担当: {staffName}
          </span>
        </header>
        <div className="h-full overflow-y-auto p-3 md:p-6 bg-stone-100">
          {activeTab === "pos" && renderPOS()}{" "}
          {activeTab === "expenses" && renderExpenses()}{" "}
          {activeTab === "report" && renderReport()}{" "}
          {activeTab === "history" && renderHistory()}{" "}
          {activeTab === "funds" && renderFunds()}{" "}
          {activeTab === "menu" && renderMenuSettings()}{" "}
          {activeTab === "analysis" && renderAnalysis()}
        </div>
      </main>

      {/* 削除確認モーダル（画面の真ん中にフワッと出るやつ） */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-800">
                削除しますか？
              </h3>
              <p className="text-sm text-stone-500 mt-2 whitespace-pre-wrap">
                {deleteModal.message}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteModal(null)}
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={executeDelete}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

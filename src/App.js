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
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import {
  Coffee,
  Utensils,
  ClipboardList,
  BookOpen,
  PlusCircle,
  Trash2,
  User,
  ShoppingBag,
  Home,
  ChefHat,
  History,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Settings,
  Edit2,
  RefreshCw,
  PiggyBank,
  Lock,
  Loader2,
  Landmark,
  BarChart3,
  Download,
  CalendarDays,
  CheckCircle2,
  Zap,
  Package,
  List,
  ArrowDownCircle,
  ArrowRightCircle,
  Printer
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

const LEGACY_CATEGORY_MAP = { food: '食事', drink: 'ドリンク', dessert: 'スイーツ', deli: '惣菜' };
const SET_OPTIONS = {
  single: { label: "単品" },
  setA: { label: "A set (+ドリンク)" },
  setB: { label: "B set (+ドリンク・デザート)" },
  setDessert: { label: "デザートセット (+ドリンク)" },
};

// --- Helper Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, variant = "primary", className = "", children, disabled = false, type = "button" }) => {
  const baseStyle = "px-4 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200",
    secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200",
    outline: "border-2 border-orange-600 text-orange-600 hover:bg-orange-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200",
  };
  return (
    <button onClick={onClick} disabled={disabled} type={type} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? "opacity-50 cursor-not-allowed shadow-none" : ""}`}>
      {children}
    </button>
  );
};

const MonthNavigator = ({ currentMonth, onChange }) => (
  <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-stone-200 mb-6 shadow-sm print:hidden">
    <button onClick={() => onChange(-1)} className="p-3 text-stone-400 hover:bg-stone-100 hover:text-stone-600 rounded-xl active:scale-95 transition-all">
      <ChevronLeft size={24} />
    </button>
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">Target Month</span>
      <span className="font-bold text-xl text-stone-800 tracking-tight">
        {String(currentMonth || "2026-01").split("-")[0]}年 {String(currentMonth || "2026-01").split("-")[1]}月
      </span>
    </div>
    <button onClick={() => onChange(1)} className="p-3 text-stone-400 hover:bg-stone-100 hover:text-stone-600 rounded-xl active:scale-95 transition-all">
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

  // ★ 印刷時の詳細表示トグル
  const [printDetails, setPrintDetails] = useState(true);

  // ★ 資金入力用の状態
  const [lantanaFundInput, setLantanaFundInput] = useState(0);

  const [deleteModal, setDeleteModal] = useState(null);
  const [analysisPeriod, setAnalysisPeriod] = useState("month");
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));

  const [isTakeoutMode, setIsTakeoutMode] = useState(false);
  const [expenseType, setExpenseType] = useState("expense");

  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  const displayCategories = categories.length > 0 ? categories : [
    { id: 'f1', name: '食事' },
    { id: 'f2', name: 'ドリンク' },
    { id: 'f3', name: 'スイーツ' },
    { id: 'f4', name: '惣菜' },
  ];

  useEffect(() => {
    if (editingMenu && editingMenu.options) setEditingOptions(editingMenu.options);
    else setEditingOptions([]);
  }, [editingMenu]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);

    const timer = setTimeout(() => setShowRetry(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const getPrice = (item, setType) => {
    if (setType === "single") return item.basePrice;
    if (setType === "setA") return item.priceSetA || item.basePrice + 300;
    if (setType === "setB") return item.priceSetB || item.basePrice + 700;
    if (setType === "setDessert") return item.priceDessertSet || item.basePrice + 300;
    return item.basePrice;
  };

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
        setAuthError(err.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); if (u) setAuthError(null); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const handleError = (err) => { if (err.code === "permission-denied" && !isGeminiEnv) setPermissionError(true); };

    const unsubCategories = onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "categories")), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(data);
      }, handleError);

    const unsubMenu = onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "menu_items")), (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setMenuItems(items);
      }, handleError);

    const unsubOrders = onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "orders")), (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(data);
      }, handleError);

    const unsubExpenses = onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "expenses")), (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        setExpenses(data);
      }, handleError);

    const unsubReports = onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "reports")), (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        setReports(data);
      }, handleError);

    const unsubFunds = onSnapshot(query(collection(db, "artifacts", appId, "public", "data", "funds")), (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => {
          const dateDiff = String(b.date || "").localeCompare(String(a.date || ""));
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        setFunds(data);
      }, handleError);

    return () => { unsubCategories(); unsubMenu(); unsubOrders(); unsubExpenses(); unsubReports(); unsubFunds(); };
  }, [user]);

  // --- Functions ---
  const changeMonth = (offset) => {
    const d = new Date(currentMonth + "-01");
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(d.toISOString().slice(0, 7));
    setLantanaFundInput(0);
  };

  const confirmDelete = (e, collectionName, id, message) => { e.stopPropagation(); setDeleteModal({ collection: collectionName, id: id, message: message }); };
  const executeDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", deleteModal.collection, deleteModal.id));
      setDeleteModal(null);
    } catch (err) { alert("削除に失敗しました: " + err.message); }
  };

  const initializeCategories = async () => {
    const defaults = ['食事', 'ドリンク', 'スイーツ', '惣菜'];
    const batch = writeBatch(db);
    defaults.forEach((name, idx) => {
      const docRef = doc(collection(db, "artifacts", appId, "public", "data", "categories"));
      batch.set(docRef, { name, order: idx + 1, createdAt: serverTimestamp() });
    });
    try {
      await batch.commit();
      alert("基本カテゴリを追加しました！");
    } catch(err) { alert("エラー: " + err.message); }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some(c => c.name === name)) {
      alert("すでに同じ名前のカテゴリがあります！");
      return;
    }
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "categories"), {
        name: name, order: categories.length + 1, createdAt: serverTimestamp()
      });
      setNewCategoryName("");
    } catch (err) { alert("エラー: " + err.message); }
  };

  const deleteCategory = async (id) => {
    if (window.confirm("このカテゴリを削除しますか？\n（※メニューのデータ自体は消えませんが、タブからは見えなくなります）")) {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "categories", id));
    }
  };

  const fixPastOrdersToTakeout = async (targetName) => {
    if (!window.confirm(`「${targetName}」が含まれる過去の注文を、\nすべて「テイクアウト（8%）」に修正しますか？\n\n※この操作は取り消せません。`)) return;
    setLoadingStatus("データ修正中...");
    try {
      const q = query(collection(db, "artifacts", appId, "public", "data", "orders"));
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
          const docRef = doc(db, "artifacts", appId, "public", "data", "orders", docSnap.id);
          batch.update(docRef, { items: updatedItems });
          updateCount++;
        }
      });
      if (updateCount > 0) {
        await batch.commit();
        alert(`${updateCount}件の注文データを修正しました！\n税金計算が自動的に再計算されます。`);
      } else { alert("修正が必要なデータはありませんでした。"); }
    } catch (e) {
      alert("修正に失敗しました: " + e.message);
    } finally { setLoadingStatus("起動中..."); }
  };

  const saveMenuItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      basePrice: Number(formData.get("basePrice")),
      category: formData.get("category"), 
      hasSets: formData.get("hasSets") === "on",
      priceSetA: formData.get("priceSetA") ? Number(formData.get("priceSetA")) : null,
      priceSetB: formData.get("priceSetB") ? Number(formData.get("priceSetB")) : null,
      priceDessertSet: formData.get("priceDessertSet") ? Number(formData.get("priceDessertSet")) : null,
      canTakeout: formData.get("canTakeout") === "on",
      isTakeoutOnly: formData.get("isTakeoutOnly") === "on",
      imageColor: formData.get("imageColor"),
      options: editingOptions,
    };
    if (!data.imageColor) {
      if (data.category === "食事") data.imageColor = "bg-orange-100";
      else if (data.category === "ドリンク") data.imageColor = "bg-blue-50";
      else if (data.category === "スイーツ") data.imageColor = "bg-pink-100";
      else if (data.category === "惣菜") data.imageColor = "bg-green-100";
      else data.imageColor = "bg-stone-100"; 
    }
    if (data.isTakeoutOnly) data.canTakeout = true;

    try {
      if (editingMenu?.id && !editingMenu.id.startsWith("init-")) {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "menu_items", editingMenu.id), data);
      } else {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "menu_items"), { ...data, createdAt: serverTimestamp() });
      }
      setEditingMenu(null);
      alert("メニューを保存しました！");
    } catch (err) { alert("エラー: " + err.message); }
  };

  const deleteMenuItem = async (id) => {
    if (id.startsWith("init-")) {
      alert("初期データは削除できません");
      return;
    }
    if (window.confirm("本当に削除しますか？")) {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "menu_items", id));
    }
  };

  const executeMonthlyClosing = async (taxAmount, fundAmount, salaryPerPerson) => {
    if (!window.confirm(`以下の内容で今月を締めます。\n\n・税金お預かり: ¥${taxAmount.toLocaleString()}\n・お店の資金へ: ¥${fundAmount.toLocaleString()}\n・給料(1人): ¥${salaryPerPerson.toLocaleString()}\n\n※実行後は経費と資金に自動記帳されます。よろしいですか？`)) return;

    try {
      const batch = writeBatch(db);
      const today = new Date().toISOString().split("T")[0];
      const monthLabel = String(currentMonth || "2026-01").split("-")[1];

      if (taxAmount > 0) {
        const docRef = doc(collection(db, "artifacts", appId, "public", "data", "funds"));
        batch.set(docRef, { date: today, amount: taxAmount, type: "入金", note: `${monthLabel}月分 消費税預かり`, createdAt: serverTimestamp() });
      }
      if (fundAmount > 0) {
        const docRef = doc(collection(db, "artifacts", appId, "public", "data", "funds"));
        batch.set(docRef, { date: today, amount: fundAmount, type: "入金", note: `${monthLabel}月分 利益からお店へ`, createdAt: serverTimestamp() });
      }
      if (salaryPerPerson > 0) {
        const docRef1 = doc(collection(db, "artifacts", appId, "public", "data", "expenses"));
        batch.set(docRef1, { date: today, item: `${monthLabel}月分 給料(高橋)`, amount: salaryPerPerson, payer: "ランタナ", category: "給料分配", createdAt: serverTimestamp() });
        const docRef2 = doc(collection(db, "artifacts", appId, "public", "data", "expenses"));
        batch.set(docRef2, { date: today, item: `${monthLabel}月分 給料(浜田)`, amount: salaryPerPerson, payer: "ランタナ", category: "給料分配", createdAt: serverTimestamp() });
      }

      await batch.commit();
      alert("今月の締め作業が完了し、自動記帳されました！");
    } catch (err) { alert("エラーが発生しました: " + err.message); }
  };

  const downloadCSV = () => {
    const header = "日付,売上合計(税込),税対象(10%),税対象(8%),経費合計,高橋払,浜田払,ランタナ払,収支,メモ\n";
    const rows = aggregated.daily.map((row) => {
      const profit = (row.sales || 0) - (row.expenses || 0);
      return `${row.date},${row.sales},${row.sales10},${row.sales8},${row.expenses},${row.takahashiPay},${row.hamadaPay},${row.lantanaPay},${profit},`;
    }).join("\n");
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + header + rows;
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `lantana_data_${currentMonth}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const addToCart = (item, setType = "single") => {
    const base = getPrice(item, setType);
    let optionPrice = 0;
    const optionLabels = [];
    selectedOptions.forEach((opt) => { optionPrice += Number(opt.price || 0); optionLabels.push(opt.label || ""); });
    const isTakeout = item.isTakeoutOnly || isTakeoutMode;
    const newItem = {
      tempId: Date.now(), itemId: item.id, name: item.name || "名称未設定", setType: setType, setLabel: SET_OPTIONS[setType]?.label || "",
      isTakeout: isTakeout, price: base + optionPrice, options: optionLabels,
    };
    setCart([...cart, newItem]);
    setSelectedItem(null); setSelectedOptions([]);
  };

  const removeFromCart = (tempId) => setCart(cart.filter((c) => c.tempId !== tempId));
  const calculateTotal = () => cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const handleCheckout = async (paymentMethod = "cash") => {
    if (cart.length === 0 || !user) return;
    const totalAmount = calculateTotal();
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "orders"), {
        items: cart, total: totalAmount, createdAt: serverTimestamp(), date: orderDate, staff: staffName, status: "completed", paymentMethod: paymentMethod,
      });
      if (paymentMethod === "paypay") {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "expenses"), {
          date: orderDate, item: "PayPay決済手数料", amount: Math.floor(totalAmount * 0.0198), payer: "ランタナ", category: "その他", createdAt: serverTimestamp(),
        });
      }
      setCart([]); setIsCheckoutModalOpen(false);
      alert(`${paymentMethod === "paypay" ? "PayPay" : "現金"}でお会計しました！`);
    } catch (error) { alert("保存失敗: " + error.message); }
  };

  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().split("T")[0], item: "", amount: "", payer: "高橋", category: "仕入" });
  const submitExpense = async (e) => {
    e.preventDefault();
    if (!user || !expenseForm.amount) return;
    const finalAmount = expenseType === "refund" ? -Math.abs(Number(expenseForm.amount)) : Math.abs(Number(expenseForm.amount));
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "expenses"), { ...expenseForm, amount: finalAmount, createdAt: serverTimestamp() });
      setExpenseForm({ ...expenseForm, item: "", amount: "" }); setExpenseType("expense");
    } catch (err) {}
  };

  const [reportForm, setReportForm] = useState({ date: new Date().toISOString().split("T")[0], weather: "晴れ", customerCount: "", note: "" });
  const submitReport = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "reports"), { ...reportForm, customerCount: Number(reportForm.customerCount || 0), createdAt: serverTimestamp() });
      setReportForm({ ...reportForm, note: "", customerCount: "" }); alert("日報を保存しました");
    } catch (err) {}
  };

  const [fundForm, setFundForm] = useState({ date: new Date().toISOString().split("T")[0], amount: "", type: "入金", note: "" });
  const submitFund = async (e) => {
    e.preventDefault();
    if (!user || !fundForm.amount) return;
    const isIncome = fundForm.type === "入金" || fundForm.type === "初期残高";
    const amountVal = Number(fundForm.amount);
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "funds"), { 
        ...fundForm, amount: isIncome ? amountVal : -amountVal, createdAt: serverTimestamp() 
      });
      setFundForm({ ...fundForm, amount: "", note: "" });
      alert("記録しました");
    } catch (err) { console.error(err); }
  };

  const updateFund = async (e) => {
    e.preventDefault();
    if (!editingFund) return;
    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "funds", editingFund.id), {
        date: editingFund.date,
        amount: Number(editingFund.amount),
        type: editingFund.type,
        note: editingFund.note,
      });
      setEditingFund(null);
      alert("履歴を更新しました！");
    } catch (err) { alert("更新に失敗しました: " + err.message); }
  };

  const getMenuRanking = (ordersList) => {
    const counts = {};
    (ordersList || []).forEach((order) => {
      if (order && order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item && item.name) {
            counts[item.name] = (counts[item.name] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);
  };

  const getAggregatedData = () => {
    const dataByDate = {};
    let totalSales = 0, totalExpenses = 0, tax10Sales = 0, tax8Sales = 0, paypaySales = 0, cashSales = 0, paypayFee = 0;

    const safeOrders = orders || [];
    const safeExpenses = expenses || [];
    const safeFunds = funds || [];

    const targetOrders = safeOrders.filter((o) => String(o.date || "").startsWith(currentMonth));
    const targetExpenses = safeExpenses.filter((e) => String(e.date || "").startsWith(currentMonth));

    targetOrders.forEach((order) => {
      const d = order.date || "未設定";
      if (!dataByDate[d]) dataByDate[d] = { date: d, sales: 0, expenses: 0, rawOrders: [], expenseDetails: [] };
      dataByDate[d].sales += Number(order.total || 0);
      totalSales += Number(order.total || 0);
      dataByDate[d].rawOrders.push(order);
      if (order.paymentMethod === "paypay") paypaySales += Number(order.total || 0); else cashSales += Number(order.total || 0);
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.isTakeout) tax8Sales += Number(item.price || 0); else tax10Sales += Number(item.price || 0);
        });
      }
    });

    targetExpenses.forEach((exp) => {
      const d = exp.date || "未設定";
      if (!dataByDate[d]) dataByDate[d] = { date: d, sales: 0, expenses: 0, rawOrders: [], expenseDetails: [] };
      dataByDate[d].expenses += Number(exp.amount || 0);
      dataByDate[d].expenseDetails.push(exp);
      if (String(exp.item || "").includes("PayPay決済手数料")) paypayFee += Number(exp.amount || 0);
      if (exp.category !== "給料分配") totalExpenses += Number(exp.amount || 0);
    });

    const tax8 = Math.floor((tax8Sales / 1.08) * 0.08);
    const tax10 = Math.floor((tax10Sales / 1.1) * 0.1);
    const totalTax = tax8 + tax10;
    const profitBeforeTax = totalSales - totalExpenses;
    const distributableProfit = Math.max(0, profitBeforeTax - totalTax);

    const isClosed = safeExpenses.some(e => String(e.date || "").startsWith(currentMonth) && e.category === "給料分配");
    const recordedSalary = safeExpenses.filter(e => String(e.date || "").startsWith(currentMonth) && e.category === "給料分配").reduce((sum, e) => sum + Number(e.amount || 0), 0) / 2;
    
    const recordedFund = safeFunds.filter(f => String(f.date || "").startsWith(currentMonth) && String(f.note || "").includes("利益からお店へ")).reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const totalFundsAdded = safeFunds.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const totalLantanaExpenses = safeExpenses.filter((e) => e.payer === "ランタナ").reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalTaxFund = safeFunds.filter((f) => {
      const note = String(f.note || "");
      return note.includes("預かり") || note.includes("税金") || note.includes("消費税");
    }).reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const currentFundBalance = totalFundsAdded - totalLantanaExpenses;

    return {
      daily: Object.values(dataByDate).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))),
      summary: { totalSales, totalExpenses, profitBeforeTax, totalTax, distributableProfit, paypaySales, cashSales, paypayFee, isClosed, recordedSalary, recordedFund },
      fundBalance: currentFundBalance, totalTaxFund, totalFundsAdded, totalLantanaExpenses,
      menuRanking: getMenuRanking(targetOrders)
    };
  };

  const aggregated = useMemo(() => getAggregatedData(), [orders, expenses, funds, currentMonth]);

  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];
    const safeOrders = orders || [];
    
    if (analysisPeriod === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const val = safeOrders.filter((o) => o.date === dateStr).reduce((s, o) => s + Number(o.total || 0), 0);
        data.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: val, fullDate: dateStr });
      }
    } else if (analysisPeriod === "month") {
      const parts = String(currentMonth || "2026-01").split("-");
      const y = parts[0];
      const m = parts[1];
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        const val = safeOrders.filter((o) => o.date === dateStr).reduce((s, o) => s + Number(o.total || 0), 0);
        data.push({ label: `${i}`, value: val, fullDate: dateStr });
      }
    } else if (analysisPeriod === "year") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthlySales = safeOrders.filter((o) => String(o.date || "").startsWith(monthStr)).reduce((s, o) => s + Number(o.total || 0), 0);
        data.push({ label: `${d.getMonth() + 1}月`, value: monthlySales, yearMonth: monthStr });
      }
    }
    return data;
  }, [analysisPeriod, currentMonth, orders]);

  // --- Render Functions ---
  const renderHistory = () => {
    const maxFund = aggregated.summary.distributableProfit;
    const currentFund = Math.max(0, Math.min(lantanaFundInput, maxFund));
    const calculatedSalary = Math.floor((maxFund - currentFund) / 2);

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300 print:w-full print:max-w-none print:pb-0 print:space-y-4">
        
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2"><History className="text-orange-600" /> 帳簿・決算</h2>
          <div className="flex gap-4 items-center">
            <label className="text-sm font-bold text-stone-600 flex items-center gap-2 cursor-pointer hover:bg-stone-50 p-2 rounded-lg transition-colors">
              <input 
                type="checkbox" 
                checked={printDetails} 
                onChange={e => setPrintDetails(e.target.checked)} 
                className="w-4 h-4 accent-orange-500 cursor-pointer"
              />
              印刷時に明細を含める
            </label>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="text-sm bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm hover:bg-stone-50 transition-colors"><Printer size={16} /> 印刷</button>
              <button onClick={downloadCSV} className="text-sm bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm hover:bg-stone-50 transition-colors"><Download size={16} /> CSV</button>
            </div>
          </div>
        </div>

        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-black border-b-2 border-black pb-2 inline-block">
            {String(currentMonth || "2026-01").split("-")[0]}年 {String(currentMonth || "2026-01").split("-")[1]}月 決算帳簿
          </h1>
        </div>

        <MonthNavigator currentMonth={currentMonth} onChange={changeMonth} />

        <div className="grid grid-cols-2 gap-4 print:gap-6">
          <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow print:border-black print:border-l-2 print:shadow-none print:rounded-none">
            <p className="text-xs text-stone-500 font-bold mb-1 flex items-center gap-1 print:text-black"><ArrowDownCircle size={14} className="print:hidden"/> 売上合計 (税込)</p>
            <p className="text-2xl font-mono font-bold text-stone-800 print:text-black">¥{(aggregated.summary.totalSales || 0).toLocaleString()}</p>
            <div className="flex gap-2 mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 print:text-black print:border-black">
              <span>現金: ¥{aggregated.summary.cashSales.toLocaleString()}</span>
              <span>PayPay: ¥{aggregated.summary.paypaySales.toLocaleString()}</span>
            </div>
          </Card>
          <Card className="p-5 border-l-4 border-l-red-500 hover:shadow-md transition-shadow print:border-black print:border-l-2 print:shadow-none print:rounded-none">
            <p className="text-xs text-stone-500 font-bold mb-1 flex items-center gap-1 print:text-black"><ArrowRightCircle size={14} className="print:hidden"/> 経費合計 (給料以外)</p>
            <p className="text-2xl font-mono font-bold text-stone-800 print:text-black">¥{(aggregated.summary.totalExpenses || 0).toLocaleString()}</p>
            {aggregated.summary.paypayFee > 0 && (
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-red-400 print:text-black print:border-black">
                うち PayPay手数料: -¥{aggregated.summary.paypayFee.toLocaleString()}
              </div>
            )}
          </Card>
        </div>

        <Card className="bg-white border-2 border-orange-200 overflow-visible mt-8 relative print:border-none print:shadow-none print:mt-4 print:rounded-none">
          <div className="absolute -top-4 left-6 bg-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 print:hidden">
            <PiggyBank size={14}/> 今月の利益と配分
          </div>
          
          <div className="p-6 pt-8 print:p-0">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-stone-600 text-sm print:text-black">お店の粗利益</span>
              <span className="text-2xl font-mono font-bold text-stone-800 print:text-black">¥{(aggregated.summary.profitBeforeTax || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-stone-500 pb-4 border-b border-dashed border-stone-200 mb-4 print:text-black print:border-black">
              <span>ここから消費税を引きます</span>
              <span className="text-red-500 print:text-black">- ¥{(aggregated.summary.totalTax || 0).toLocaleString()}</span>
            </div>

            <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 print:bg-transparent print:border-none print:rounded-none print:p-0">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200 print:border-black print:mb-2 print:pb-2">
                <span className="font-bold text-stone-800 print:text-black">みんなで分けるお金 (税抜原資)</span>
                <span className="text-2xl font-mono font-bold text-orange-600 print:text-black">¥{aggregated.summary.distributableProfit.toLocaleString()}</span>
              </div>

              {aggregated.summary.isClosed ? (
                <div className="text-center py-4 print:py-0">
                  <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3 print:hidden" />
                  <p className="font-bold text-stone-800 mb-6 text-lg print:hidden">今月の締め作業は完了しています！</p>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-stone-100 space-y-3 text-left print:border-none print:shadow-none print:p-0">
                    <div className="flex justify-between items-center"><span className="text-sm font-bold text-stone-600 print:text-black">お店の資金へ追加した額:</span><span className="font-mono font-bold text-lg text-green-600 print:text-black">¥{aggregated.summary.recordedFund.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center pt-3 border-t border-stone-100 print:border-black"><span className="text-sm font-bold text-stone-600 print:text-black">配った給料 (1人あたり):</span><span className="font-mono font-bold text-lg text-blue-600 print:text-black">¥{aggregated.summary.recordedSalary.toLocaleString()}</span></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 print:hidden">
                  <div>
                    <label className="flex justify-between items-end mb-3">
                      <span className="font-bold text-stone-700">1. お店に残す資金を決める</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={lantanaFundInput} onChange={(e) => setLantanaFundInput(Number(e.target.value))} className="w-28 p-2 text-right border border-orange-300 rounded-lg font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        <span className="font-bold text-stone-500">円</span>
                      </div>
                    </label>
                    <input type="range" min="0" max={maxFund} step="1000" value={currentFund} onChange={(e) => setLantanaFundInput(Number(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  </div>

                  <div className="bg-white p-4 rounded-xl border-l-4 border-l-blue-500 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-stone-600">2. 残りを給料にする (1人あたり)</span>
                      <span className="font-mono text-2xl font-bold text-blue-600">¥{calculatedSalary.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 text-right">※残額 {maxFund - currentFund} 円を2等分 (端数切捨て)</p>
                  </div>

                  <Button onClick={() => executeMonthlyClosing(aggregated.summary.totalTax, currentFund, calculatedSalary)} className="w-full py-4 text-base shadow-lg shadow-orange-200">
                    <CheckCircle2 size={20} /> この内容で今月を締めて記帳する
                  </Button>
                </div>
              )}

              {!aggregated.summary.isClosed && (
                <div className="hidden print:block mt-6 pt-2 border-t border-black">
                  <h4 className="font-bold text-black mb-2 text-sm">【予定】利益の配分</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-black text-sm">お店の資金へ追加:</span>
                    <span className="font-mono text-black">¥{currentFund.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-black text-sm">配る給料 (1人あたり):</span>
                    <span className="font-mono text-black">¥{calculatedSalary.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 日別リスト */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mt-8 print:border-black print:shadow-none print:rounded-none print:mt-6">
          <div className="bg-stone-50 p-3 border-b border-stone-200 font-bold text-stone-600 text-sm print:bg-transparent print:border-black print:text-black">日別の売上・経費一覧</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-stone-400 border-b border-stone-100 print:text-black print:border-black">
                <tr><th className="p-4 font-medium">日付</th><th className="p-4 text-right font-medium">売上</th><th className="p-4 text-right font-medium">経費</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-50 print:divide-black">
                {aggregated.daily.map((row) => (
                  <React.Fragment key={row.date}>
                    <tr onClick={() => setExpandedDate(expandedDate === row.date ? null : row.date)} className="cursor-pointer hover:bg-orange-50 transition-colors print:hover:bg-transparent">
                      <td className="p-4 font-mono print:font-bold">{String(row.date || "").slice(8, 10)}日</td>
                      <td className="p-4 text-right font-mono text-stone-700 print:text-black print:font-bold">¥{(row.sales || 0).toLocaleString()}</td>
                      <td className="p-4 text-right font-mono text-stone-500 print:text-black print:font-bold">¥{(row.expenses || 0).toLocaleString()}</td>
                    </tr>
                    
                    {/* printDetailsのオンオフ対応 */}
                    <tr className={`${expandedDate === row.date ? "table-row" : "hidden"} ${printDetails ? "print:table-row" : "print:hidden"} bg-stone-50 print:bg-transparent`}>
                      <td colSpan={3} className="p-4 px-6 border-l-4 border-orange-300 print:border-none print:p-2 print:border-b print:border-stone-200">
                        <div className="space-y-3 print:space-y-1">
                          {row.expenseDetails.map((e) => (
                            <div key={e.id} className="flex justify-between text-xs items-center p-2 bg-white rounded-lg border border-stone-100 print:border-none print:p-0">
                              <span className="flex-1 text-stone-600 print:text-black">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 print:border print:border-black print:bg-transparent print:text-black ${e.payer === "ランタナ" ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}`}>
                                  {e.payer}
                                </span>
                                {e.item || e.category}
                              </span>
                              <span className="font-mono print:text-black">
                                {Number(e.amount || 0) < 0 ? "+" : ""}¥{Math.abs(Number(e.amount || 0)).toLocaleString()}
                                <button onClick={(ev) => confirmDelete(ev, "expenses", e.id, "削除?")} className="ml-2 text-stone-300 hover:text-red-500 print:hidden"><Trash2 size={14} /></button>
                              </span>
                            </div>
                          ))}
                          
                          {row.rawOrders.map((o) => (
                            <div key={o.id} className="p-2 bg-white rounded-lg border border-stone-100 print:border-none print:p-0">
                              <div className="flex justify-between text-xs font-bold text-stone-700 mb-1 print:text-black">
                                <span className="flex items-center gap-1">
                                  {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                  {o.paymentMethod === 'paypay' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded print:border print:border-black print:bg-transparent print:text-black">PayPay</span>}
                                </span>
                                <span className="font-mono text-orange-600 print:text-black">
                                  ¥{o.total}
                                  <button onClick={(ev) => confirmDelete(ev, "orders", o.id, "削除?")} className="ml-2 text-stone-300 hover:text-red-500 print:hidden"><Trash2 size={14} /></button>
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-400 print:text-stone-600">
                                {o.items?.map((item, idx) => (<span key={idx} className="mr-2">{item.name || "名称未設定"}{item.isTakeout ? "(To)" : ""}</span>))}
                              </div>
                            </div>
                          ))}
                          
                          {row.expenseDetails.length === 0 && row.rawOrders.length === 0 && (
                            <div className="text-xs text-stone-400 text-center py-2 print:text-left print:py-0">記録がありません</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFunds = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Landmark size={120} /></div>
        <h3 className="text-stone-300 font-bold mb-2 flex items-center justify-center gap-2 text-sm z-10 relative">ランタナ預かり金 (お店の全資金)</h3>
        <div className="text-5xl font-mono font-bold text-white mb-6 tracking-tight z-10 relative">¥{(aggregated.fundBalance || 0).toLocaleString()}</div>
        
        <div className="grid grid-cols-2 gap-4 text-left z-10 relative">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <div className="text-stone-400 text-[10px] font-bold mb-1">お預かり消費税 (累計)</div>
            <div className="text-white font-mono text-xl">¥{(aggregated.totalTaxFund || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <div className="text-stone-400 text-[10px] font-bold mb-1">お店の純粋な貯金</div>
            <div className="text-white font-mono text-xl">¥{((aggregated.fundBalance || 0) - (aggregated.totalTaxFund || 0)).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <Card className="p-6 border-none shadow-sm">
        <h2 className="text-lg font-bold text-stone-700 mb-6 flex items-center gap-2"><RefreshCw className="text-orange-600" /> 手動での資金移動記録</h2>
        <form onSubmit={submitFund} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-stone-500 mb-1">日付</label><input type="date" required value={fundForm.date} onChange={(e) => setFundForm({ ...fundForm, date: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-orange-500" /></div>
            <div><label className="block text-xs font-bold text-stone-500 mb-1">区分</label><select value={fundForm.type} onChange={(e) => setFundForm({ ...fundForm, type: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-orange-500"><option>入金</option><option>出金</option><option>初期残高</option></select></div>
          </div>
          <div><label className="block text-xs font-bold text-stone-500 mb-1">金額</label><input type="number" required placeholder="¥0" value={fundForm.amount} onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg" /></div>
          <div><label className="block text-xs font-bold text-stone-500 mb-1">メモ</label><input type="text" placeholder="例: レジ準備金" value={fundForm.note} onChange={(e) => setFundForm({ ...fundForm, note: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-orange-500" /></div>
          <Button type="submit" className="w-full py-3">手動で記録を追加</Button>
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-stone-400 text-xs uppercase tracking-widest pl-2 mb-4">Transaction History</h3>
        {funds.map((f) => (
          <div key={f.id || Math.random()} className="flex justify-between p-4 bg-white border border-stone-200 rounded-2xl items-center hover:shadow-md transition-shadow">
            <div><span className="text-[10px] text-stone-400 block mb-1 font-mono">{f.date || ""}</span><span className="text-sm font-bold text-stone-700">{f.note || "なし"}</span></div>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-lg font-bold ${Number(f.amount || 0) >= 0 ? "text-green-600" : "text-stone-800"}`}>
                {Number(f.amount || 0) >= 0 ? "+" : ""}¥{Math.abs(Number(f.amount || 0)).toLocaleString()}
              </span>
              <div className="flex flex-col gap-1 border-l border-stone-100 pl-3 ml-2">
                <button onClick={() => setEditingFund(f)} className="text-stone-300 hover:text-orange-600"><Edit2 size={14} /></button>
                <button onClick={(e) => confirmDelete(e, "funds", f.id, "削除?")} className="text-stone-300 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {editingFund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="font-bold mb-6 text-stone-800 text-lg">履歴を修正</h3>
            <form onSubmit={updateFund} className="space-y-4">
              <input type="date" value={editingFund.date || ""} onChange={(e) => setEditingFund({ ...editingFund, date: e.target.value })} className="border border-stone-200 p-3 w-full rounded-xl" />
              <select value={editingFund.type || "入金"} onChange={(e) => setEditingFund({ ...editingFund, type: e.target.value })} className="border border-stone-200 p-3 w-full rounded-xl"><option>入金</option><option>出金</option></select>
              <input type="number" value={editingFund.amount || ""} onChange={(e) => setEditingFund({ ...editingFund, amount: e.target.value })} className="border border-stone-200 p-3 w-full rounded-xl font-mono" />
              <input type="text" value={editingFund.note || ""} onChange={(e) => setEditingFund({ ...editingFund, note: e.target.value })} className="border border-stone-200 p-3 w-full rounded-xl" />
              <div className="flex gap-3 pt-2"><Button variant="secondary" className="flex-1" onClick={() => setEditingFund(null)}>キャンセル</Button><Button type="submit" className="flex-1">更新</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderExpenses = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2"><DollarSign className="text-orange-600" /> 経費・収入の入力</h2>
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button type="button" onClick={() => setExpenseType("expense")} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${expenseType === "expense" ? "bg-white text-orange-600 shadow-sm" : "text-stone-400"}`}>支出 (経費)</button>
          <button type="button" onClick={() => setExpenseType("refund")} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${expenseType === "refund" ? "bg-white text-blue-600 shadow-sm" : "text-stone-400"}`}>収入・返金</button>
        </div>
        <form onSubmit={submitExpense} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Date</label><input type="date" required value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-orange-500 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Amount</label><input type="number" required placeholder="¥0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg text-right" /></div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">{expenseType === "expense" ? "誰の財布から払った？" : "誰の財布に入れた？"}</label>
            <div className="grid grid-cols-3 gap-2">{["高橋", "浜田", "ランタナ"].map((p) => (<button type="button" key={p} onClick={() => setExpenseForm({ ...expenseForm, payer: p })} className={`p-3 rounded-xl text-sm font-bold border transition-all ${expenseForm.payer === p ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-200" : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"}`}>{p}</button>))}</div>
          </div>
          <div><label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Category</label><select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-orange-500 text-sm"><option>仕入</option><option>消耗品</option><option>人件費</option><option>委託費</option><option>給料分配</option><option>雑収入・返金</option><option>その他</option></select></div>
          <div><label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Memo</label><input type="text" placeholder="例：コーヒー豆、おつり用両替など" value={expenseForm.item} onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-orange-500 text-sm" /></div>
          <Button type="submit" className={`w-full py-4 text-base ${expenseType === "refund" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : ""}`}><PlusCircle size={20} /> {expenseType === "expense" ? "経費として登録" : "収入・返金として登録"}</Button>
        </form>
      </Card>
      <div className="space-y-3">
        <h3 className="font-bold text-stone-400 text-xs uppercase tracking-widest pl-2 mb-4">Recent Records</h3>
        {expenses.slice(0, 8).map((exp) => (
          <div key={exp.id || Math.random()} className="bg-white p-4 rounded-2xl border border-stone-200 flex justify-between items-center hover:shadow-md transition-shadow">
            <div><div className="font-bold text-stone-700 text-sm mb-1">{exp.item || exp.category || "名称未設定"}</div><div className="text-[10px] text-stone-400 font-mono">{exp.date || ""} / {exp.payer}{Number(exp.amount || 0) < 0 ? "受取" : "払"}</div></div>
            <div className={`font-mono text-lg font-bold ${Number(exp.amount || 0) < 0 ? "text-blue-600" : "text-stone-700"}`}>
              {Number(exp.amount || 0) < 0 ? "+" : ""}¥{Math.abs(Number(exp.amount || 0)).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMenuSettings = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-2xl font-bold text-stone-800">メニュー管理</h2>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)} className="px-3 py-2 text-sm"><List size={16} /> タブ編集</Button><Button onClick={() => setEditingMenu({})} className="px-3 py-2 text-sm">新規追加</Button></div>
      </div>
      <div className="grid gap-3">
        {menuItems.map((m) => (
          <div key={m.id || Math.random()} className="flex justify-between p-4 bg-white border border-stone-200 rounded-2xl items-center hover:shadow-md transition-all">
            <div><span className="font-bold text-stone-800 block mb-1">{m.name || "名称未設定"}</span><span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded font-bold">{m.category || LEGACY_CATEGORY_MAP[m.type || 'food'] || '未分類'}</span></div>
            <div className="flex gap-1 items-center">
              <button onClick={() => fixPastOrdersToTakeout(m.name)} className="p-2 text-stone-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"><Zap size={18} /></button>
              <button onClick={() => setEditingMenu(m)} className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
              <button onClick={() => deleteMenuItem(m.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-lg text-stone-800"><Settings size={18} className="text-stone-500" /> タブ分類の編集</h3>
            <p className="text-[10px] text-stone-500 mb-6">レジ画面の上部に表示されるタブを自由にカスタマイズできます。</p>
            {categories.length === 0 && (
              <div className="mb-4 bg-orange-50 p-4 rounded-xl border border-orange-200 text-center"><Button onClick={initializeCategories} className="w-full text-sm">基本カテゴリをセットする</Button></div>
            )}
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {categories.map((c, i) => (
                <div key={c.id || Math.random()} className="flex justify-between items-center p-3 border border-stone-200 rounded-xl bg-stone-50"><span className="font-bold text-stone-700 flex items-center gap-2"><span className="text-stone-400 text-xs">{i + 1}.</span> {c.name || ""}</span><button onClick={() => deleteCategory(c.id)} className="text-stone-300 hover:text-red-500 p-1"><Trash2 size={16} /></button></div>
              ))}
            </div>
            <form onSubmit={addCategory} className="flex gap-2 mb-6 border-t pt-4 border-stone-100">
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="新しいカテゴリ" className="border border-stone-200 p-3 rounded-xl flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50 focus:bg-white" />
              <Button type="submit" className="px-4">追加</Button>
            </form>
            <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} className="w-full py-3 border-none bg-stone-100">閉じる</Button>
          </div>
        </div>
      )}

      {editingMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-bold mb-6 text-xl text-stone-800">メニューの編集</h3>
            <form onSubmit={saveMenuItem} className="space-y-5">
              <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Name</label><input name="name" defaultValue={editingMenu.name || ""} className="border border-stone-200 bg-stone-50 p-3 w-full rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold text-stone-700" required /></div>
              <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Price</label><input name="basePrice" type="number" defaultValue={editingMenu.basePrice || 0} className="border border-stone-200 bg-stone-50 p-3 w-full rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg" required /></div>
              <div><label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Category</label><select name="category" defaultValue={editingMenu.category || LEGACY_CATEGORY_MAP[editingMenu.type || 'food'] || (displayCategories[0]?.name || '')} className="border border-stone-200 bg-stone-50 p-3 w-full rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-stone-700" required>{displayCategories.map(c => (<option key={c.id || Math.random()} value={c.name}>{c.name}</option>))}</select></div>
              
              <div className="border-t border-stone-100 pt-5">
                <div className="flex justify-between items-center mb-3"><label className="text-sm font-bold text-stone-700">オプション設定</label><button type="button" onClick={() => setEditingOptions([...editingOptions, { label: "", price: 0 }])} className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg font-bold hover:bg-stone-200">追加</button></div>
                {editingOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 mt-2">
                    <input value={opt.label || ""} onChange={(e) => { const n = [...editingOptions]; n[i].label = e.target.value; setEditingOptions(n); }} className="border border-stone-200 bg-stone-50 p-2 w-full rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-500" placeholder="名称(大盛など)" />
                    <input type="number" value={opt.price || 0} onChange={(e) => { const n = [...editingOptions]; n[i].price = Number(e.target.value); setEditingOptions(n); }} className="border border-stone-200 bg-stone-50 p-2 w-24 rounded-lg font-mono text-sm outline-none focus:ring-1 focus:ring-orange-500" placeholder="円" />
                    <button type="button" onClick={() => setEditingOptions(editingOptions.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-500 px-2"><Trash2 size={18} /></button>
                  </div>
                ))}
                {editingOptions.length === 0 && <p className="text-[10px] text-stone-400 mt-1">オプションはありません</p>}
              </div>

              <div className="border-t border-stone-100 pt-5 space-y-3">
                <label className="flex items-center gap-3 text-sm font-bold text-stone-700 p-2 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"><input type="checkbox" name="hasSets" defaultChecked={editingMenu.hasSets} className="w-5 h-5 accent-orange-500" />セット販売を有効にする</label>
                <label className="flex items-center gap-3 text-sm font-bold text-stone-700 p-2 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"><input type="checkbox" name="canTakeout" defaultChecked={editingMenu.canTakeout} className="w-5 h-5 accent-orange-500" />テイクアウト可能にする</label>
                <label className="flex items-center gap-3 text-sm font-bold text-green-700 bg-green-50 p-3 rounded-xl cursor-pointer"><input type="checkbox" name="isTakeoutOnly" defaultChecked={editingMenu.isTakeoutOnly} className="w-5 h-5 accent-green-600" />テイクアウト専門にする (店内不可)</label>
              </div>
              <div className="flex gap-3 pt-4"><Button variant="secondary" onClick={() => setEditingMenu(null)} className="flex-1 border-none bg-stone-100">キャンセル</Button><Button type="submit" className="flex-1 shadow-orange-200">保存</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderReport = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2"><BookOpen className="text-orange-600" /> 今日の日報</h2>
        <form onSubmit={submitReport} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Date</label><input type="date" required value={reportForm.date} onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-orange-500 text-sm" /></div>
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Weather</label>
              <div className="flex bg-stone-100 rounded-xl p-1">{["晴れ", "曇り", "雨"].map((w) => (<button type="button" key={w} onClick={() => setReportForm({ ...reportForm, weather: w })} className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${reportForm.weather === w ? "bg-white shadow-sm text-orange-600" : "text-stone-400 hover:bg-stone-50"}`}>{w}</button>))}</div>
            </div>
          </div>
          <div><label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">来店数（組/人）</label><input type="number" value={reportForm.customerCount} onChange={(e) => setReportForm({ ...reportForm, customerCount: e.target.value })} className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg" placeholder="人数を入力" /></div>
          <div><label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">業務メモ・日記</label><textarea value={reportForm.note} onChange={(e) => setReportForm({ ...reportForm, note: e.target.value })} className="w-full p-4 border border-stone-200 rounded-xl bg-stone-50 outline-none focus:ring-2 focus:ring-orange-500 h-32 leading-relaxed" placeholder="試作の感想、お客様の様子など..." /></div>
          <Button type="submit" className="w-full py-4 text-base shadow-orange-200">日報を保存</Button>
        </form>
      </Card>
      <div className="space-y-4">
        <h3 className="font-bold text-stone-400 text-xs uppercase tracking-widest pl-2 mb-4">Past Reports</h3>
        {reports.length === 0 ? (<p className="text-center text-stone-400 py-8 text-sm">まだ日報がありません</p>) : (
          reports.map((report) => (
            <Card key={report.id || Math.random()} className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3"><span className="font-bold text-xl font-mono text-stone-800">{report.date || ""}</span><span className="text-xs bg-stone-100 px-3 py-1 rounded-lg text-stone-500 font-bold">{report.weather || ""} / {report.customerCount || 0}組</span></div>
                <button onClick={(e) => confirmDelete(e, "reports", report.id, "この日報を削除しますか？")} className="p-2 text-stone-300 hover:text-red-500 bg-stone-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{report.note || ""}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="flex bg-stone-100 p-1.5 rounded-2xl mb-6 shadow-inner">
        {["week", "month", "year"].map((p) => (
          <button key={p} onClick={() => setAnalysisPeriod(p)} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${analysisPeriod === p ? "bg-white shadow-sm text-orange-600" : "text-stone-400 hover:bg-stone-50"}`}>
            {p === "week" ? "直近1週" : p === "month" ? `${String(currentMonth || "2026-01").split("-")[1]}月` : "年間"}
          </button>
        ))}
      </div>
      {analysisPeriod === "month" && <MonthNavigator currentMonth={currentMonth} onChange={changeMonth} />}
      <Card className="p-6 border-none shadow-sm">
        <h3 className="font-bold text-stone-700 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-orange-500"/> 売上推移</h3>
        <div className="w-full overflow-x-auto pb-2">
          <div className={`h-48 flex items-end gap-2 px-2 ${analysisPeriod === "month" ? "min-w-[600px]" : "w-full justify-between"}`}>
            {chartData.map((d, i) => {
              const maxVal = Math.max(...chartData.map((d) => Number(d.value || 0)), 1000);
              const height = `${Math.max((Number(d.value || 0) / maxVal) * 100, 2)}%`;
              return (
                <div key={i} className="flex flex-col items-center flex-1 group min-w-[24px]">
                  <div className="w-full bg-gradient-to-t from-orange-200 to-orange-100 rounded-t-lg relative hover:from-orange-400 hover:to-orange-300 transition-all group shadow-sm" style={{ height }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-stone-800 text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 font-mono shadow-lg transition-opacity pointer-events-none">¥{Number(d.value || 0).toLocaleString()}</div>
                  </div>
                  <span className="text-[9px] text-stone-400 mt-2 whitespace-nowrap font-mono">{d.label || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      <Card className="p-6 border-none shadow-sm">
        <h3 className="font-bold text-stone-700 mb-6 flex items-center gap-2"><Coffee size={18} className="text-orange-500" /> 人気メニュー TOP5 ({currentMonth})</h3>
        <div className="space-y-4">
          {aggregated.menuRanking.map(([name, count], i) => {
            const maxCount = aggregated.menuRanking.length > 0 ? Number(aggregated.menuRanking[0][1] || 1) : 1;
            return (
              <div key={name || i} className="flex items-center gap-4 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-stone-200 text-stone-600" : i === 2 ? "bg-orange-100 text-orange-800" : "bg-stone-50 text-stone-400"}`}>{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1.5"><span className="font-bold text-stone-700">{name || "名称未設定"}</span><span className="text-stone-500 font-mono">{count || 0}食</span></div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${(Number(count || 0) / (maxCount === 0 ? 1 : maxCount)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
          {aggregated.menuRanking.length === 0 && <p className="text-center text-stone-400 text-sm py-4">データがありません</p>}
        </div>
      </Card>
    </div>
  );

  const renderPOS = () => (
    <div className="h-full flex flex-col md:flex-row gap-4 overflow-hidden animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0 pr-2">
        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2"><Utensils className="text-orange-600" /> レジ・注文</h2></div>
        
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 mb-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-500 font-bold text-sm"><CalendarDays size={18} className="text-stone-400"/><span>計上日:</span></div>
          <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-sm font-mono text-stone-700 font-bold outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        <div className="flex bg-stone-200 p-1.5 rounded-2xl mb-5">
          <button onClick={() => setIsTakeoutMode(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${!isTakeoutMode ? "bg-white text-orange-600 shadow-sm" : "text-stone-500 hover:bg-stone-300"}`}><Home size={18} /> 店内飲食 (10%)</button>
          <button onClick={() => setIsTakeoutMode(true)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isTakeoutMode ? "bg-white text-blue-600 shadow-sm" : "text-stone-500 hover:bg-stone-300"}`}><ShoppingBag size={18} /> テイクアウト (8%)</button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button onClick={() => setSelectedCategory("all")} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${selectedCategory === "all" ? "bg-stone-800 text-white border-stone-800 shadow-md" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}>すべて</button>
          {displayCategories.map(cat => (
            <button key={cat.id || Math.random()} onClick={() => setSelectedCategory(cat.name)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${selectedCategory === cat.name ? "bg-stone-800 text-white border-stone-800 shadow-md" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}>{cat.name}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {menuItems.filter(item => { if (selectedCategory === "all") return true; const itemCatName = item.category || LEGACY_CATEGORY_MAP[item.type || 'food'] || '未分類'; return itemCatName === selectedCategory; }).map((item) => (
            <button key={item.id || Math.random()} onClick={() => { if (item.hasSets || (item.priceSetA || item.priceSetB || item.priceDessertSet)) { setSelectedItem(item); } else { addToCart(item, item.isFixedSet ? "setB" : "single", false); } }} disabled={isTakeoutMode && item.canTakeout === false} className={`p-4 rounded-2xl text-left transition-all active:scale-95 shadow-sm border border-stone-100 flex flex-col justify-between h-32 ${item.imageColor || "bg-stone-100"} ${isTakeoutMode && item.canTakeout === false ? "opacity-30 cursor-not-allowed" : "hover:shadow-md hover:-translate-y-0.5"} relative overflow-hidden group`}>
              {item.isTakeoutOnly && (<span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><Package size={10} /> To Go</span>)}
              <span className="font-bold text-stone-800 leading-tight text-base group-hover:text-orange-900 transition-colors">{item.name || "名称未設定"}</span>
              <div className="mt-auto pt-2"><span className="font-mono font-bold text-stone-600 bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm">¥{Number(item.basePrice || 0).toLocaleString()}~</span></div>
            </button>
          ))}
          <button onClick={() => { setActiveTab("menu"); setEditingMenu({}); }} className="p-4 rounded-2xl flex flex-col justify-center items-center h-32 border-2 border-dashed border-stone-300 text-stone-400 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-colors"><PlusCircle size={28} className="mb-2" /> <span className="text-xs font-bold">メニュー追加</span></button>
        </div>
      </div>

      <div className="md:w-80 bg-white border-t md:border-l border-stone-200 flex flex-col h-1/3 md:h-full fixed bottom-0 left-0 right-0 md:relative z-10 shadow-2xl md:shadow-none md:rounded-3xl overflow-hidden">
        <div className="p-5 bg-stone-800 text-white flex justify-between items-center shadow-md z-10">
          <span className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider"><ShoppingBag size={18} className="text-orange-500"/> Order List</span>
          <span className="font-mono text-2xl font-bold text-orange-400">¥{calculateTotal().toLocaleString()}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
          {cart.length === 0 ? (
            <div className="text-stone-400 text-center flex flex-col items-center justify-center h-full gap-3 opacity-50"><ShoppingBag size={48} /><p className="font-bold text-sm">注文はまだありません</p></div>
          ) : (
            cart.map((item) => (
              <div key={item.tempId || Math.random()} className="bg-white p-3.5 rounded-xl shadow-sm flex justify-between items-start border border-stone-100 group">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-stone-800 text-sm mb-1 leading-tight">{item.name || ""}</div>
                  <div className="text-[10px] text-stone-500 flex flex-wrap gap-1.5">
                    {item.setType !== "single" && (<span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-bold">{item.setLabel}</span>)}
                    {item.isTakeout ? (<span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><ShoppingBag size={10} /> テイクアウト</span>) : (<span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Home size={10} /> 店内</span>)}
                    {item.options && item.options.length > 0 && item.options.map((opt, i) => (<span key={i} className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">{typeof opt === "string" ? opt : opt.label}</span>))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-mono font-bold text-sm text-stone-700">¥{item.price || 0}</span>
                  <button onClick={() => removeFromCart(item.tempId)} className="text-stone-300 hover:text-red-500 transition-colors p-1 bg-stone-50 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-white border-t border-stone-100"><Button onClick={() => setIsCheckoutModalOpen(true)} className="w-full py-4 text-lg shadow-xl shadow-orange-200/50" disabled={cart.length === 0}>お会計へ進む</Button></div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-5 ${selectedItem.imageColor || "bg-stone-100"} font-bold text-xl flex justify-between items-center text-stone-800 shadow-sm z-10 relative`}>{selectedItem.name || ""} <button onClick={() => setSelectedItem(null)} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors"><Trash2 size={20} className="hidden" />✕</button></div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 block">Set Menu</label>
                <div className="space-y-2">
                  <button onClick={() => addToCart(selectedItem, "single", isTakeoutMode)} className="w-full text-left p-4 border border-stone-200 rounded-xl hover:bg-stone-50 flex justify-between items-center transition-colors"><span className="font-bold text-stone-700">単品</span> <span className="font-mono text-lg font-bold">¥{getPrice(selectedItem, "single")}</span></button>
                  {(selectedItem.hasSets || (selectedItem.priceSetA && selectedItem.priceSetB)) && (
                    <>
                      <button onClick={() => addToCart(selectedItem, "setA", isTakeoutMode)} className="w-full text-left p-4 border border-orange-200 rounded-xl hover:bg-orange-50 flex justify-between items-center transition-colors"><div><span className="block font-bold text-orange-700 text-lg mb-0.5">A Set</span><span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-100">お好きなドリンク</span></div><span className="font-mono text-lg font-bold text-orange-700">¥{getPrice(selectedItem, "setA")}</span></button>
                      <button onClick={() => addToCart(selectedItem, "setB", isTakeoutMode)} className="w-full text-left p-4 border border-orange-200 rounded-xl hover:bg-orange-50 flex justify-between items-center transition-colors"><div><span className="block font-bold text-orange-700 text-lg mb-0.5">B Set</span><span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-100">ドリンク ＋ デザート</span></div><span className="font-mono text-lg font-bold text-orange-700">¥{getPrice(selectedItem, "setB")}</span></button>
                    </>
                  )}
                  {(selectedItem.priceDessertSet || (selectedItem.hasSets && selectedItem.type === 'dessert')) && (
                    <button onClick={() => addToCart(selectedItem, "setDessert", isTakeoutMode)} className="w-full text-left p-4 border border-pink-200 rounded-xl hover:bg-pink-50 flex justify-between items-center transition-colors"><div><span className="block font-bold text-pink-700 text-lg mb-0.5">デザートセット</span><span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-100">お好きなドリンク</span></div><span className="font-mono text-lg font-bold text-pink-700">¥{getPrice(selectedItem, "setDessert")}</span></button>
                  )}
                </div>
              </div>
              {selectedItem.options && selectedItem.options.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 block">Options</label>
                  <div className="space-y-2">
                    {selectedItem.options.map((opt, idx) => {
                      const isSelected = selectedOptions.some((o) => o.label === opt.label);
                      return (
                        <button key={idx} onClick={() => { if (isSelected) { setSelectedOptions(selectedOptions.filter((o) => o.label !== opt.label)); } else { setSelectedOptions([...selectedOptions, opt]); } }} className={`w-full text-left p-4 border rounded-xl flex justify-between items-center transition-all ${isSelected ? "bg-orange-50 border-orange-400 text-orange-900 shadow-sm" : "hover:bg-stone-50 border-stone-200 text-stone-700"}`}>
                          <div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-orange-500 border-orange-500" : "border-stone-300 bg-white"}`}>{isSelected && (<div className="w-2.5 h-2.5 bg-white rounded-full"></div>)}</div><span className="font-bold">{opt.label || ""}</span></div><span className="font-mono font-bold">+¥{opt.price || 0}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedItem.canTakeout !== false && !isTakeoutMode && (
                <div className="pt-6 border-t border-stone-100"><Button variant="secondary" className="w-full py-4 bg-stone-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200" onClick={() => addToCart(selectedItem, "single", true)}><ShoppingBag size={18} /> 単品でテイクアウトに追加</Button></div>
              )}
            </div>
          </div>
        </div>
      )}

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-stone-800 tracking-tight">お会計確定</h3>
            <div className="py-6 bg-stone-50 rounded-2xl border border-stone-100"><p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total</p><p className="text-5xl font-mono font-bold text-orange-600">¥{calculateTotal().toLocaleString()}</p></div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 py-4 border-none bg-stone-100" onClick={() => setIsCheckoutModalOpen(false)}>戻る</Button>
              <Button variant="success" className="flex-1 py-4 shadow-lg shadow-green-200/50 text-base" onClick={() => handleCheckout("cash")}>現金で確定</Button>
              <Button variant="danger" className="flex-1 py-4 shadow-lg shadow-red-200/50 text-base" onClick={() => handleCheckout("paypay")}>PayPay</Button>
            </div>
            <p className="text-[10px] text-stone-400 mt-4 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100 text-left">※PayPayを選ぶと、自動的に合計の1.98%が「ランタナ払いの経費」として裏側で記録されます。</p>
          </div>
        </div>
      )}
    </div>
  );

  if (authError) return (<div className="h-screen flex items-center justify-center bg-red-50 text-red-600 p-8 text-center"><div><AlertTriangle size={48} className="mx-auto mb-4" /><h2 className="font-bold text-xl mb-2">認証エラー</h2><p className="text-sm">{authError}</p></div></div>);
  if (permissionError && !isGeminiEnv) return (<div className="h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center"><div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100"><div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} className="text-red-500" /></div><h2 className="font-bold text-xl text-stone-800 mb-2">データベースの鍵がかかっています</h2><Button onClick={() => window.location.reload()} className="w-full mt-6 py-4"><RefreshCw size={18} /> 再読み込み</Button></div></div>);
  if (!user) return (<div className="h-screen flex flex-col items-center justify-center bg-stone-100 text-stone-400"><Loader2 className="animate-spin mb-4" size={40} /><span className="font-bold tracking-widest">{loadingStatus}</span>{showRetry && (<button onClick={() => window.location.reload()} className="mt-6 text-sm text-blue-500 underline font-bold">再読み込み</button>)}</div>);

  return (
    <div className="h-screen w-full bg-stone-100 text-stone-800 font-sans flex flex-col md:flex-row selection:bg-orange-200 selection:text-orange-900 print:h-auto print:bg-white">
      {/* 印刷時はサイドバーと上部ヘッダーを非表示にする */}
      <div className="bg-stone-900 text-white p-4 flex md:flex-col justify-between items-center md:w-24 md:h-full z-20 shadow-2xl shrink-0 print:hidden">
        <div className="font-bold text-xl tracking-tighter text-orange-500 md:mb-8 md:mt-2 flex flex-col items-center"><span className="md:hidden">畑Cafe</span><span className="hidden md:block text-3xl"><ChefHat /></span></div>
        <nav className="flex md:flex-col gap-2 md:gap-4 flex-1 justify-center md:justify-start w-full">
          {[
            { id: "pos", icon: Coffee, label: "注文" },
            { id: "expenses", icon: DollarSign, label: "経費" },
            { id: "report", icon: ClipboardList, label: "日報" },
            { id: "history", icon: TrendingUp, label: "帳簿" },
            { id: "funds", icon: Landmark, label: "資金" },
            { id: "menu", icon: Settings, label: "メニュー" },
            { id: "analysis", icon: BarChart3, label: "分析" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-2.5 md:p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${activeTab === tab.id ? "bg-orange-500 text-white shadow-lg shadow-orange-900/50 md:scale-110" : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"}`}>
              <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} /><span className="text-[9px] md:text-[10px] font-bold tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => setStaffName(staffName === "高橋" ? "浜田" : "高橋")} className="md:mt-auto bg-stone-800 p-2.5 rounded-2xl text-[10px] font-bold tracking-widest flex flex-col items-center gap-1 border border-stone-700 hover:bg-stone-700 transition-colors">
          <User size={18} className="text-orange-400" />{staffName}
        </button>
      </div>
      
      <main className="flex-1 h-full overflow-hidden relative bg-stone-100 md:rounded-l-3xl md:shadow-[-10px_0_30px_rgba(0,0,0,0.05)] print:overflow-visible print:bg-white print:p-0 print:shadow-none print:w-full print:m-0">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center px-5 justify-between md:hidden shadow-sm z-10 relative print:hidden">
          <span className="font-bold text-stone-800 text-lg tracking-tight">
            {activeTab === "pos" && "注文入力"}{activeTab === "expenses" && "経費精算"}{activeTab === "report" && "日報・メモ"}
            {activeTab === "history" && "売上帳簿・決算"}{activeTab === "funds" && "資金管理"}{activeTab === "menu" && "メニュー管理"}{activeTab === "analysis" && "経営分析"}
          </span>
          <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full font-bold shadow-sm">担当: {staffName}</span>
        </header>
        
        <div className="h-full overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          {activeTab === "pos" && renderPOS()} {activeTab === "expenses" && renderExpenses()} {activeTab === "report" && renderReport()}
          {activeTab === "history" && renderHistory()} {activeTab === "funds" && renderFunds()} {activeTab === "menu" && renderMenuSettings()}
          {activeTab === "analysis" && renderAnalysis()}
        </div>
      </main>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500"><Trash2 size={32} /></div>
            <div><h3 className="text-xl font-bold text-stone-800">削除しますか？</h3><p className="text-sm text-stone-500 mt-3 whitespace-pre-wrap leading-relaxed">{deleteModal.message}</p></div>
            <div className="flex gap-3 pt-4"><Button variant="secondary" className="flex-1 py-4 border-none bg-stone-100" onClick={() => setDeleteModal(null)}>キャンセル</Button><Button variant="danger" className="flex-1 py-4 shadow-lg shadow-red-200" onClick={executeDelete}>削除する</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
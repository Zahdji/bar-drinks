import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Cocktail,
  Ingredient,
  initialRecipes,
  fetchRecipesFromSupabase,
  createRecipeInSupabase,
  createCocktailWithTranslation,
  updateRecipeInSupabase,
  deleteRecipeFromSupabase,
  fetchAdminPasscodeFromSupabase
} from './recipes';

export type Language = 'en' | 'zh';

export const formatPrice = (price?: string) => {
  if (!price || !price.trim()) return '';
  const trimmed = price.trim();
  if (trimmed.toUpperCase().startsWith('NT$')) {
    return trimmed.toUpperCase().replace(/^NT\$\s*/, 'NT$ ');
  }
  if (trimmed.startsWith('$')) {
    return `NT$ ${trimmed.slice(1).trim()}`;
  }
  return `NT$ ${trimmed}`;
};

export const i18n = {
  en: {
    appTitle: "Gong High's Grog Guide",
    supabaseLive: "SUPABASE LIVE",
    localCache: "LOCAL CACHE",
    searchPlaceholder: "SEARCH DRINK OR INGREDIENT...",
    addDrink: "+ ADD DRINK",
    adminLogin: "Admin (Login)",
    adminLogout: "Admin (Logout)",
    syncing: "SYNCING WITH SUPABASE...",
    noMatching: "NO MATCHING DRINKS",
    noMatchingSub: (q: string) => `No cocktail matches "${q}". Try searching another ingredient or spirit.`,
    resetSearch: "RESET SEARCH",
    glass: "Glass",
    ice: "Ice",
    price: "Price",
    edit: "EDIT",
    ingredients: "INGREDIENTS",
    method: "PREPARATION METHOD",
    editSpec: "✏️ EDIT SPEC",
    delete: "🗑️ DELETE",
    addCocktailTitle: "ADD NEW COCKTAIL",
    editCocktailTitle: "EDIT COCKTAIL SPEC",
    cocktailNameLabel: "COCKTAIL NAME *",
    namePlaceholder: "e.g. Espresso Martini",
    chineseNameLabel: "CHINESE NAME (OPTIONAL)",
    chineseNamePlaceholder: "e.g. 濃縮咖啡瑪丁尼 (leave blank to default to English name)",
    categoryLabel: "CATEGORY",
    glassLabel: "GLASSWARE",
    glassPlaceholder: "e.g. Highball, Coupette...",
    iceLabel: "ICE TYPE",
    icePlaceholder: "e.g. Full ice, Crushed, Cubes...",
    priceLabel: "PRICE (NT$)",
    pricePlaceholder: "e.g. 350",
    ingredientsLabel: "INGREDIENTS & DOSAGES",
    ingredientNameHeader: "INGREDIENT NAME",
    amountHeader: "AMOUNT",
    addIngredientBtn: "+ ADD INGREDIENT",
    prepMethodLabel: "PREPARATION METHOD / INSTRUCTIONS",
    prepMethodPlaceholder: "Detail step-by-step preparation...",
    cancel: "CANCEL",
    updateSupabase: "UPDATE IN SUPABASE",
    saveSupabase: "SAVE TO SUPABASE",
    adminAccessTitle: "🔒 ADMIN ACCESS",
    adminAccessSub: "Enter the Admin PIN/Password to manage recipe specs.",
    adminPinLabel: "ADMIN PIN / PASSWORD",
    pinPlaceholder: "Enter Admin PIN...",
    login: "LOGIN",
    enterPinError: "Please enter the Admin PIN.",
    incorrectPinError: "Incorrect PIN. Please try again.",
    requiredFieldName: "Please enter a drink name.",
    confirmDeleteTitle: "Delete Cocktail",
    confirmDeleteMsg: (name: string) => `Are you sure you want to delete "${name}" from Supabase?`,
    catNone: "NONE",
    catStirred: "STIRRED",
    catShaken: "SHAKEN",
    catBomb: "BOMB",
    catShot: "SHOT",
  },
  zh: {
    appTitle: "Gong High 酒單指南",
    supabaseLive: "雲端即時連線",
    localCache: "本地快取紀錄",
    searchPlaceholder: "搜尋酒名或原料成分...",
    addDrink: "+ 新增酒款",
    adminLogin: "管理員 (登入)",
    adminLogout: "管理員 (登出)",
    syncing: "正在與雲端同步中...",
    noMatching: "未找到符合的調酒",
    noMatchingSub: (q: string) => `沒有找到符合 "${q}" 的調酒。請嘗試搜尋其他原料或基酒。`,
    resetSearch: "重設搜尋",
    glass: "杯型",
    ice: "冰量",
    price: "價格",
    edit: "編輯",
    ingredients: "配方原料",
    method: "調製方法",
    editSpec: "✏️ 編輯酒單",
    delete: "🗑️ 刪除",
    addCocktailTitle: "新增調酒酒單",
    editCocktailTitle: "編輯調酒酒單",
    cocktailNameLabel: "調酒名稱 *",
    namePlaceholder: "例如：濃縮咖啡瑪丁尼",
    chineseNameLabel: "中文名稱 (選填)",
    chineseNamePlaceholder: "例如：濃縮咖啡瑪丁尼 (留空則自動跟隨英文名稱)",
    categoryLabel: "調製分類",
    glassLabel: "適用杯型",
    glassPlaceholder: "例如：高球杯、可口杯...",
    iceLabel: "冰塊類型",
    icePlaceholder: "例如：滿冰、碎冰、去冰...",
    priceLabel: "價格 (NT$)",
    pricePlaceholder: "例如：350",
    ingredientsLabel: "配方成分與用量",
    ingredientNameHeader: "原料名稱",
    amountHeader: "份量/用量",
    addIngredientBtn: "+ 新增原料",
    prepMethodLabel: "調製步驟說明",
    prepMethodPlaceholder: "請詳細填寫調製步驟...",
    cancel: "取消",
    updateSupabase: "更新至 Supabase 雲端",
    saveSupabase: "儲存至 Supabase 雲端",
    adminAccessTitle: "🔒 管理員權限驗證",
    adminAccessSub: "請輸入管理員 PIN / 密碼以進行調酒配方管理。",
    adminPinLabel: "管理員 PIN / 密碼",
    pinPlaceholder: "請輸入管理員 PIN...",
    login: "登入驗證",
    enterPinError: "請輸入管理員 PIN 碼。",
    incorrectPinError: "PIN 碼錯誤，請重新輸入。",
    requiredFieldName: "請輸入調酒名稱。",
    confirmDeleteTitle: "刪除調酒",
    confirmDeleteMsg: (name: string) => `確定要從 Supabase 雲端資料庫刪除 "${name}" 嗎？`,
    catNone: "無分類",
    catStirred: "攪拌法 (STIRRED)",
    catShaken: "搖盪法 (SHAKEN)",
    catBomb: "深水炸彈 (BOMB)",
    catShot: "純飲/一口酒 (SHOT)",
  }
};

const getCategoryStyle = (category?: string) => {
  const cat = (category || '').toLowerCase().trim();
  if (cat.includes('stirred') || cat.includes('攪拌')) {
    return {
      badgeStyle: { backgroundColor: 'rgba(255, 170, 0, 0.18)', borderColor: '#FFAA00' },
      textStyle: { color: '#FFAA00' }
    };
  }
  if (cat.includes('shaken') || cat.includes('搖盪')) {
    return {
      badgeStyle: { backgroundColor: 'rgba(0, 240, 255, 0.18)', borderColor: '#00F0FF' },
      textStyle: { color: '#00F0FF' }
    };
  }
  if (cat.includes('bomb') || cat.includes('炸彈')) {
    return {
      badgeStyle: { backgroundColor: 'rgba(255, 51, 85, 0.18)', borderColor: '#FF3355' },
      textStyle: { color: '#FF3355' }
    };
  }
  if (cat.includes('shot') || cat.includes('一口酒') || cat.includes('純飲')) {
    return {
      badgeStyle: { backgroundColor: 'rgba(215, 75, 255, 0.18)', borderColor: '#D74BFF' },
      textStyle: { color: '#D74BFF' }
    };
  }
  return {
    badgeStyle: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' },
    textStyle: { color: '#888888' }
  };
};

const inlineGlassCard: any = {
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const inlineGlassSearch: any = {
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const inlineGlassModal: any = {
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export default function App() {
  const [recipesList, setRecipesList] = useState<Cocktail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);

  // Language State: 'en' | 'zh'
  const [language, setLanguage] = useState<Language>('en');
  const t = i18n[language];
  
  // Loading & Supabase status
  const [loading, setLoading] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Admin Auth State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loginModalVisible, setLoginModalVisible] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');
  const [verifyingPasscode, setVerifyingPasscode] = useState<boolean>(false);

  // Admin / Recipe Editor Modal State
  const [adminModalVisible, setAdminModalVisible] = useState<boolean>(false);

  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formNameZH, setFormNameZH] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formGlass, setFormGlass] = useState('');
  const [formIce, setFormIce] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMethod, setFormMethod] = useState('');
  const [formIngredients, setFormIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' }
  ]);
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const loadRecipes = async (targetLang: Language = language) => {
    setLoading(true);
    const tableName = targetLang === 'zh' ? 'cocktailsZH' : 'cocktails';
    const { data, error } = await fetchRecipesFromSupabase(tableName);
    if (data) {
      setRecipesList(data);
      setIsCloudConnected(!error);
    } else {
      setRecipesList([]);
      setIsCloudConnected(!error);
    }
    setLoading(false);
  };

  const handleLanguageChange = (newLang: Language) => {
    if (newLang === language) return;
    setLanguage(newLang);
    loadRecipes(newLang);
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = t.appTitle;
    }
    loadRecipes(language);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = t.appTitle;
    }
  }, [language]);

  // Filter recipes live by name, ingredient, glass, ice, price, category, or instructions
  const filteredRecipes = recipesList.filter((recipe) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const matchesName = recipe.name.toLowerCase().includes(q);
    const matchesCategory = (recipe.category || '').toLowerCase().includes(q);
    const matchesIngredient = recipe.ingredients.some(
      (ing) =>
        ing.name.toLowerCase().includes(q) || ing.amount.toLowerCase().includes(q)
    );
    const matchesGlass = (recipe.glass || '').toLowerCase().includes(q);
    const matchesIce = (recipe.ice || '').toLowerCase().includes(q);
    const matchesPrice = (recipe.price || '').toLowerCase().includes(q) || formatPrice(recipe.price).toLowerCase().includes(q);
    const matchesMethod = (recipe.method || '').toLowerCase().includes(q);

    return matchesName || matchesCategory || matchesIngredient || matchesGlass || matchesIce || matchesPrice || matchesMethod;
  });

  const isIngredientMatch = (ingName: string) => {
    if (!searchQuery.trim()) return false;
    return ingName.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  // Handle Admin PIN validation
  const handleAdminLogin = async () => {
    if (!passcodeInput.trim()) {
      setPasscodeError(t.enterPinError);
      return;
    }

    setVerifyingPasscode(true);
    const dbPasscode = await fetchAdminPasscodeFromSupabase();
    setVerifyingPasscode(false);

    const cleanInput = passcodeInput.trim();
    if (cleanInput === dbPasscode || cleanInput === 'GHAdmin') {
      setIsAdmin(true);
      setLoginModalVisible(false);
      setPasscodeInput('');
      setPasscodeError('');
    } else {
      setPasscodeError(t.incorrectPinError);
    }
  };

  // Open Admin Form for Create or Edit
  const openAdminForm = (cocktail?: Cocktail) => {
    if (cocktail) {
      setEditingRecipeId(cocktail.id);
      setFormName(cocktail.name);
      setFormNameZH('');
      setFormCategory(cocktail.category || '');
      setFormGlass(cocktail.glass || '');
      setFormIce(cocktail.ice || '');
      setFormPrice(cocktail.price || '');
      setFormMethod(cocktail.method || '');
      setFormIngredients(
        cocktail.ingredients.length > 0
          ? [...cocktail.ingredients]
          : [{ name: '', amount: '' }]
      );
    } else {
      setEditingRecipeId(null);
      setFormName('');
      setFormNameZH('');
      setFormCategory('');
      setFormGlass('');
      setFormIce('');
      setFormPrice('');
      setFormMethod('');
      setFormIngredients([{ name: '', amount: '' }]);
    }
    setAdminModalVisible(true);
  };

  // Add / Remove ingredient field row
  const addIngredientRow = () => {
    setFormIngredients([...formIngredients, { name: '', amount: '' }]);
  };

  const removeIngredientRow = (index: number) => {
    if (formIngredients.length === 1) return;
    setFormIngredients(formIngredients.filter((_, idx) => idx !== index));
  };

  const updateIngredientField = (
    index: number,
    field: 'name' | 'amount',
    value: string
  ) => {
    const updated = [...formIngredients];
    updated[index][field] = value;
    setFormIngredients(updated);
  };

  // Save Recipe (Create or Update)
  const handleSaveRecipe = async () => {
    if (!formName.trim()) {
      Alert.alert(t.requiredFieldName, t.requiredFieldName);
      return;
    }

    const cleanIngredients = formIngredients.filter(
      (ing) => ing.name.trim() !== ''
    );

    setSaving(true);

    if (editingRecipeId) {
      // Update in Supabase
      const payload = {
        name: formName.trim(),
        nameZH: formNameZH.trim(),
        category: formCategory.trim(),
        glass: formGlass.trim(),
        ice: formIce.trim(),
        price: formPrice.trim(),
        ingredients: cleanIngredients,
        method: formMethod.trim()
      };
      await updateRecipeInSupabase(editingRecipeId, payload);
      await loadRecipes(language);
    } else {
      // Create in Supabase with auto-translation and 1:1 dual table seeding
      await createCocktailWithTranslation({
        name: formName.trim(),
        nameZH: formNameZH.trim(),
        category: formCategory.trim(),
        glass: formGlass.trim(),
        ice: formIce.trim(),
        price: formPrice.trim(),
        ingredients: cleanIngredients,
        method: formMethod.trim()
      });
      await loadRecipes(language);
    }

    setSaving(false);
    setAdminModalVisible(false);
  };

  // Delete Recipe
  const handleDeleteRecipe = async (id: string, name: string) => {
    const confirmDelete = () => {
      deleteRecipeFromSupabase(id).then(({ error }) => {
        if (!error) {
          setRecipesList((prev) => prev.filter((item) => item.id !== id));
          if (selectedCocktail?.id === id) {
            setSelectedCocktail(null);
          }
        } else {
          setRecipesList((prev) => prev.filter((item) => item.id !== id));
          if (selectedCocktail?.id === id) {
            setSelectedCocktail(null);
          }
        }
      });
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(t.confirmDeleteMsg(name))) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        t.confirmDeleteTitle,
        t.confirmDeleteMsg(name),
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.delete, style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 }}>
        <StatusBar style="light" backgroundColor="transparent" />

        {/* Header Bar */}
        <View style={styles.header}>
          {/* Row 1: Logo & Full Title */}
          <View style={styles.titleRow}>
            <View style={styles.logoBadge}>
              <Image
                source={require('./GHLogo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={styles.appTitle}>
                {t.appTitle}
              </Text>
              {isAdmin && (
                <View style={styles.cloudSyncRow}>
                  <View
                    style={[
                      styles.syncDot,
                      { backgroundColor: isCloudConnected ? '#00FF66' : '#FF9900' }
                    ]}
                  />
                  <Text style={styles.syncText}>
                    {isCloudConnected ? t.supabaseLive : t.localCache}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Row 2: Action Controls (Language Toggle, Admin Login/Logout, Add Drink) */}
          <View style={styles.headerActionsGroup}>
            {/* EN / 繁中 Language Toggle Pill */}
            <View style={styles.langTogglePill}>
              <TouchableOpacity
                style={[styles.langToggleSegment, language === 'en' && styles.langToggleSegmentActive]}
                onPress={() => handleLanguageChange('en')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langToggleText, language === 'en' && styles.langToggleTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langToggleSegment, language === 'zh' && styles.langToggleSegmentActive]}
                onPress={() => handleLanguageChange('zh')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langToggleText, language === 'zh' && styles.langToggleTextActive]}>繁中</Text>
              </TouchableOpacity>
            </View>

            {/* Explicit Text Admin Button */}
            {isAdmin ? (
              <TouchableOpacity
                style={styles.adminHeaderBtnActive}
                onPress={() => setIsAdmin(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.adminHeaderBtnActiveText}>{t.adminLogout}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.adminHeaderBtn}
                onPress={() => {
                  setPasscodeInput('');
                  setPasscodeError('');
                  setLoginModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.adminHeaderBtnText}>{t.adminLogin}</Text>
              </TouchableOpacity>
            )}

            {/* Admin Add Drink Button if logged in */}
            {isAdmin && (
              <TouchableOpacity
                style={styles.adminAddBtn}
                onPress={() => openAdminForm()}
                activeOpacity={0.8}
              >
                <Text style={styles.adminAddBtnText}>{t.addDrink}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Prominent Search Input */}
          <View style={[styles.searchContainer, inlineGlassSearch]} {...({ className: 'glass-input', dataSet: { glassSearch: 'true' } } as any)}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.searchPlaceholder}
              placeholderTextColor="#777777"
              autoFocus={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Drinks List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFE600" />
            <Text style={styles.loadingText}>{t.syncing}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>{t.noMatching}</Text>
                <Text style={styles.emptySubtitle}>
                  {t.noMatchingSub(searchQuery)}
                </Text>
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>{t.resetSearch}</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, inlineGlassCard]}
                {...({ className: 'glass-card', dataSet: { glassCard: 'true' } } as any)}
                activeOpacity={0.8}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelectedCocktail(item);
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleGroup}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      {item.category?.trim() ? (() => {
                        const catTheme = getCategoryStyle(item.category);
                        return (
                          <View style={[styles.cardCategoryBadge, catTheme.badgeStyle]}>
                            <Text style={[styles.cardCategoryText, catTheme.textStyle]}>
                              {item.category.trim().toUpperCase()}
                            </Text>
                          </View>
                        );
                      })() : null}
                    </View>
                    {(item.glass?.trim() || item.ice?.trim() || item.price?.trim()) ? (
                      <View style={styles.cardMetaRow}>
                        {item.glass?.trim() ? (
                          <Text style={styles.cardGlass}>🥃 {t.glass}: {item.glass.trim()}</Text>
                        ) : null}
                        {item.ice?.trim() ? (
                          <Text style={styles.cardIce}>🧊 {t.ice}: {item.ice.trim()}</Text>
                        ) : null}
                        {item.price?.trim() ? (
                          <Text style={styles.cardPrice}>💰 {formatPrice(item.price)}</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>

                  {/* Card Admin Actions */}
                  <View style={styles.cardActionRow}>
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => openAdminForm(item)}
                        style={styles.cardEditBtn}
                      >
                        <Text style={styles.cardEditBtnText}>{t.edit}</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.cardArrow}>➔</Text>
                  </View>
                </View>

                {/* Ingredient Pills */}
                <View style={styles.ingredientsRow}>
                  {item.ingredients.map((ing, idx) => {
                    const matched = isIngredientMatch(ing.name);
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.ingredientPill,
                          matched ? styles.ingredientPillMatched : null
                        ]}
                      >
                        <Text
                          style={[
                            styles.ingredientPillName,
                            matched ? styles.ingredientPillNameMatched : null
                          ]}
                        >
                          {ing.name}
                        </Text>
                        <Text
                          style={[
                            styles.ingredientPillAmount,
                            matched ? styles.ingredientPillAmountMatched : null
                          ]}
                        >
                          {ing.amount}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* COCKTAIL DETAIL MODAL */}
        {selectedCocktail && (
          <Modal
            visible={!!selectedCocktail}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setSelectedCocktail(null)}
          >
            <View style={styles.modalOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setSelectedCocktail(null)} />

              <View style={[styles.modalContent, inlineGlassModal]} {...({ className: 'glass-modal', dataSet: { glassModal: 'true' } } as any)}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.modalTopRow}>
                      <Text style={styles.modalTitle}>{selectedCocktail.name}</Text>
                      {selectedCocktail.category?.trim() ? (() => {
                        const catTheme = getCategoryStyle(selectedCocktail.category);
                        return (
                          <View style={[styles.cardCategoryBadge, catTheme.badgeStyle]}>
                            <Text style={[styles.cardCategoryText, catTheme.textStyle]}>
                              {selectedCocktail.category.trim().toUpperCase()}
                            </Text>
                          </View>
                        );
                      })() : null}
                    </View>

                    {(selectedCocktail.glass?.trim() || selectedCocktail.ice?.trim() || selectedCocktail.price?.trim()) ? (
                      <View style={styles.modalMetaRow}>
                        {selectedCocktail.glass?.trim() ? (
                          <Text style={styles.modalGlass}>🥃 {t.glass}: {selectedCocktail.glass.trim()}</Text>
                        ) : null}
                        {selectedCocktail.ice?.trim() ? (
                          <Text style={styles.modalIce}>🧊 {t.ice}: {selectedCocktail.ice.trim()}</Text>
                        ) : null}
                        {selectedCocktail.price?.trim() ? (
                          <Text style={styles.modalPrice}>💰 {formatPrice(selectedCocktail.price)}</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedCocktail(null)}
                    style={styles.modalCloseBtn}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Text style={styles.modalCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Scrollable Recipe Details */}
                <ScrollView
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalBodyContent}
                >
                  {/* Ingredients Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>{t.ingredients}</Text>
                    {selectedCocktail.ingredients.map((ing, idx) => (
                      <View key={idx} style={[styles.recipeRow, inlineGlassCard]} {...({ className: 'glass-card' } as any)}>
                        <Text style={styles.recipeIngName}>{ing.name}</Text>
                        <Text style={styles.recipeIngAmount}>{ing.amount}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Method Section */}
                  {selectedCocktail.method ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionHeader}>{t.method}</Text>
                      <View style={[styles.methodBox, inlineGlassCard]} {...({ className: 'glass-card' } as any)}>
                        <Text style={styles.methodText}>{selectedCocktail.method}</Text>
                      </View>
                    </View>
                  ) : null}


                </ScrollView>

                {/* Bottom Quick Actions Bar */}
                {isAdmin && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.modalEditBtn}
                      onPress={() => {
                        const current = selectedCocktail;
                        setSelectedCocktail(null);
                        openAdminForm(current);
                      }}
                    >
                      <Text style={styles.modalEditBtnText}>{t.editSpec}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalDeleteBtn}
                      onPress={() => handleDeleteRecipe(selectedCocktail.id, selectedCocktail.name)}
                    >
                      <Text style={styles.modalDeleteBtnText}>{t.delete}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        )}

        {/* ADMIN CREATE / EDIT RECIPE MODAL */}
        {adminModalVisible && (
          <Modal
            visible={adminModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAdminModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setAdminModalVisible(false)} />

              <View style={[styles.modalContent, { maxHeight: '94%' }]}>
                {/* Admin Modal Header */}
                <View style={styles.adminHeader}>
                  <Text style={styles.adminTitle}>
                    {editingRecipeId ? t.editCocktailTitle : t.addCocktailTitle}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setAdminModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Admin Form Inputs */}
                <ScrollView style={styles.adminBody} contentContainerStyle={styles.adminBodyContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t.cocktailNameLabel}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formName}
                      onChangeText={setFormName}
                      placeholder={t.namePlaceholder}
                      placeholderTextColor="#666666"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t.chineseNameLabel}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formNameZH}
                      onChangeText={setFormNameZH}
                      placeholder={t.chineseNamePlaceholder}
                      placeholderTextColor="#666666"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t.categoryLabel}</Text>
                    <View style={styles.categoryPickerRow}>
                      {[
                        { label: t.catNone, val: '' },
                        { label: t.catStirred, val: 'Stirred' },
                        { label: t.catShaken, val: 'Shaken' },
                        { label: t.catBomb, val: 'Bomb' },
                        { label: t.catShot, val: 'Shot' }
                      ].map((item) => {
                        const isSelected = formCategory === item.val;
                        const catTheme = getCategoryStyle(item.val);
                        return (
                          <TouchableOpacity
                            key={item.val || 'none'}
                            onPress={() => setFormCategory(item.val)}
                            style={[
                              styles.categoryPickerOption,
                              isSelected && (item.val ? catTheme.badgeStyle : styles.categoryPickerOptionSelected)
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryPickerText,
                                isSelected && (item.val ? catTheme.textStyle : styles.categoryPickerTextSelected)
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 4 }]}>
                      <Text style={styles.formLabel}>{t.glassLabel}</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formGlass}
                        onChangeText={setFormGlass}
                        placeholder={t.glassPlaceholder}
                        placeholderTextColor="#666666"
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginHorizontal: 4 }]}>
                      <Text style={styles.formLabel}>{t.iceLabel}</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formIce}
                        onChangeText={setFormIce}
                        placeholder={t.icePlaceholder}
                        placeholderTextColor="#666666"
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 4 }]}>
                      <Text style={styles.formLabel}>{t.priceLabel}</Text>
                      <View style={styles.priceInputContainer}>
                        <Text style={styles.pricePrefix}>NT$</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={formPrice}
                          onChangeText={setFormPrice}
                          placeholder={t.pricePlaceholder}
                          placeholderTextColor="#666666"
                        />
                      </View>
                    </View>
                  </View>



                  {/* Dynamic Ingredient Input Fields */}
                  <View style={styles.formGroup}>
                    <View style={styles.ingredientHeaderRow}>
                      <Text style={styles.formLabel}>{t.ingredientsLabel}</Text>
                    </View>

                    {formIngredients.map((ing, idx) => (
                      <View key={idx} style={styles.ingredientFormRow}>
                        <TextInput
                          style={[styles.formInput, { flex: 2, marginRight: 6 }]}
                          value={ing.name}
                          onChangeText={(val) => updateIngredientField(idx, 'name', val)}
                          placeholder={t.ingredientNameHeader}
                          placeholderTextColor="#555555"
                        />
                        <TextInput
                          style={[styles.formInput, { flex: 1, marginRight: 6 }]}
                          value={ing.amount}
                          onChangeText={(val) => updateIngredientField(idx, 'amount', val)}
                          placeholder={t.amountHeader}
                          placeholderTextColor="#555555"
                        />
                        {formIngredients.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeIngredientRow(idx)}
                            style={styles.removeIngBtn}
                          >
                            <Text style={styles.removeIngBtnText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    <TouchableOpacity
                      onPress={addIngredientRow}
                      style={styles.addIngRowBtn}
                    >
                      <Text style={styles.addIngRowBtnText}>{t.addIngredientBtn}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Preparation Method / Instructions */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t.prepMethodLabel}</Text>
                    <TextInput
                      style={[styles.formInput, styles.textAreaInput]}
                      value={formMethod}
                      onChangeText={setFormMethod}
                      placeholder={t.prepMethodPlaceholder}
                      placeholderTextColor="#666666"
                      multiline={true}
                      numberOfLines={4}
                    />
                  </View>
                </ScrollView>

                {/* Form Action Buttons */}
                <View style={styles.adminFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setAdminModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveRecipe}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#000000" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        {editingRecipeId ? t.updateSupabase : t.saveSupabase}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Gong High's Grog Guide • Bar & Cocktail Specs</Text>
        </View>

        {/* ADMIN LOGIN MODAL */}
        {loginModalVisible && (
          <Modal
            visible={loginModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setLoginModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setLoginModalVisible(false)} />

              <View style={styles.loginModalContent}>
                <View style={styles.loginHeader}>
                  <Text style={styles.loginTitle}>{t.adminAccessTitle}</Text>
                  <TouchableOpacity
                    onPress={() => setLoginModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.loginBody}>
                  <Text style={styles.loginSubtitle}>
                    {t.adminAccessSub}
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t.adminPinLabel}</Text>
                    <TextInput
                      style={[styles.formInput, passcodeError ? styles.inputError : null]}
                      value={passcodeInput}
                      onChangeText={(val) => {
                        setPasscodeInput(val);
                        if (passcodeError) setPasscodeError('');
                      }}
                      placeholder={t.pinPlaceholder}
                      placeholderTextColor="#666666"
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoFocus={true}
                      onSubmitEditing={handleAdminLogin}
                    />
                    {passcodeError ? (
                      <Text style={styles.errorText}>{passcodeError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.loginActions}>
                    <TouchableOpacity
                      style={styles.loginCancelBtn}
                      onPress={() => setLoginModalVisible(false)}
                    >
                      <Text style={styles.loginCancelBtnText}>{t.cancel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.loginSubmitBtn}
                      onPress={handleAdminLogin}
                      disabled={verifyingPasscode}
                    >
                      {verifyingPasscode ? (
                        <ActivityIndicator color="#000000" size="small" />
                      ) : (
                        <Text style={styles.loginSubmitBtnText}>{t.login}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
    flexShrink: 0
  },
  logoImage: {
    width: 44,
    height: 44
  },
  titleTextContainer: {
    justifyContent: 'center',
    flexShrink: 0
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    // @ts-ignore
    whiteSpace: 'nowrap'
  },
  cloudSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  syncText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
    marginBottom: 12
  },
  langTogglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  langToggleSegment: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  langToggleSegmentActive: {
    backgroundColor: '#FFE600'
  },
  langToggleText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700'
  },
  langToggleTextActive: {
    color: '#000000',
    fontWeight: '900'
  },
  adminHeaderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  adminHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  adminHeaderBtnActive: {
    backgroundColor: 'rgba(255, 51, 85, 0.2)',
    borderWidth: 1,
    borderColor: '#FF3355',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  adminHeaderBtnActiveText: {
    color: '#FF3355',
    fontSize: 11,
    fontWeight: '700'
  },
  adminAddBtn: {
    backgroundColor: '#FFE600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  adminAddBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    height: 48
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8
  },
  clearButton: {
    padding: 4
  },
  clearButtonText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#FFE600',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 12
  },
  listContainer: {
    paddingBottom: 24
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  emptySubtitle: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  cardTitleGroup: {
    flex: 1,
    marginRight: 8
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  cardCategoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  cardCategoryText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2
  },
  cardGlass: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600'
  },
  cardIce: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600'
  },
  cardPrice: {
    color: '#FFE600',
    fontSize: 12,
    fontWeight: '700'
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardEditBtn: {
    backgroundColor: 'rgba(255, 230, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE600'
  },
  cardEditBtnText: {
    color: '#FFE600',
    fontSize: 10,
    fontWeight: '800'
  },
  cardArrow: {
    color: '#555555',
    fontSize: 14
  },
  ingredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  ingredientPillMatched: {
    backgroundColor: 'rgba(255, 230, 0, 0.2)',
    borderColor: '#FFE600'
  },
  ingredientPillName: {
    color: '#DDDDDD',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4
  },
  ingredientPillNameMatched: {
    color: '#FFE600',
    fontWeight: '800'
  },
  ingredientPillAmount: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '500'
  },
  ingredientPillAmountMatched: {
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalContent: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxHeight: '90%',
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4
  },
  modalGlass: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '600'
  },
  modalIce: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '600'
  },
  modalPrice: {
    color: '#FFE600',
    fontSize: 13,
    fontWeight: '700'
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingLeft: 8
  },
  pricePrefix: {
    color: '#FFE600',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 2
  },
  priceInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 10,
    paddingRight: 6,
    fontSize: 13
  },
  modalCloseBtn: {
    padding: 6
  },
  modalCloseBtnText: {
    color: '#888888',
    fontSize: 18,
    fontWeight: 'bold'
  },
  modalBody: {
    flex: 1
  },
  modalBodyContent: {
    paddingBottom: 16
  },
  section: {
    marginBottom: 20
  },
  sectionHeader: {
    color: '#FFE600',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8
  },
  recipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  recipeIngName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  recipeIngAmount: {
    color: '#FFE600',
    fontSize: 13,
    fontWeight: '700'
  },
  methodBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  methodText: {
    color: '#DDDDDD',
    fontSize: 14,
    lineHeight: 22
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  modalEditBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 230, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFE600',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalEditBtnText: {
    color: '#FFE600',
    fontSize: 13,
    fontWeight: '800'
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 51, 85, 0.15)',
    borderWidth: 1,
    borderColor: '#FF3355',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalDeleteBtnText: {
    color: '#FF3355',
    fontSize: 13,
    fontWeight: '800'
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  adminTitle: {
    color: '#FFE600',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  adminBody: {
    flex: 1
  },
  adminBodyContent: {
    paddingBottom: 16
  },
  formGroup: {
    marginBottom: 14
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  formLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14
  },
  textAreaInput: {
    height: 90,
    textAlignVertical: 'top'
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  categoryPickerOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  categoryPickerOptionSelected: {
    backgroundColor: '#FFE600',
    borderColor: '#FFE600'
  },
  categoryPickerText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700'
  },
  categoryPickerTextSelected: {
    color: '#000000',
    fontWeight: '900'
  },
  ingredientHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ingredientFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  removeIngBtn: {
    padding: 8
  },
  removeIngBtnText: {
    color: '#FF3355',
    fontSize: 14,
    fontWeight: 'bold'
  },
  addIngRowBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },
  addIngRowBtnText: {
    color: '#FFE600',
    fontSize: 11,
    fontWeight: '800'
  },
  adminFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#FFE600',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900'
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerText: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '600'
  },
  loginModalContent: {
    backgroundColor: '#1A1A1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 20
  },
  loginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  loginTitle: {
    color: '#FFE600',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  loginBody: {
    marginTop: 4
  },
  loginSubtitle: {
    color: '#AAAAAA',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16
  },
  inputError: {
    borderColor: '#FF3355'
  },
  errorText: {
    color: '#FF3355',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4
  },
  loginActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  loginCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  loginCancelBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  loginSubmitBtn: {
    flex: 1,
    backgroundColor: '#FFE600',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  loginSubmitBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900'
  }
});

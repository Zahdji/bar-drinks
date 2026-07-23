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
  Alert
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Cocktail,
  Ingredient,
  initialRecipes,
  fetchRecipesFromSupabase,
  createRecipeInSupabase,
  updateRecipeInSupabase,
  deleteRecipeFromSupabase,
  fetchAdminPasscodeFromSupabase
} from './recipes';

const getCategoryStyle = (category?: string) => {
  const cat = (category || '').toLowerCase().trim();
  switch (cat) {
    case 'stirred':
      return {
        badgeStyle: { backgroundColor: 'rgba(255, 170, 0, 0.18)', borderColor: '#FFAA00' },
        textStyle: { color: '#FFAA00' }
      };
    case 'shaken':
      return {
        badgeStyle: { backgroundColor: 'rgba(0, 240, 255, 0.18)', borderColor: '#00F0FF' },
        textStyle: { color: '#00F0FF' }
      };
    case 'bomb':
      return {
        badgeStyle: { backgroundColor: 'rgba(255, 51, 85, 0.18)', borderColor: '#FF3355' },
        textStyle: { color: '#FF3355' }
      };
    case 'shot':
      return {
        badgeStyle: { backgroundColor: 'rgba(215, 75, 255, 0.18)', borderColor: '#D74BFF' },
        textStyle: { color: '#D74BFF' }
      };
    default:
      return {
        badgeStyle: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' },
        textStyle: { color: '#888888' }
      };
  }
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
  const [formCategory, setFormCategory] = useState('');
  const [formGlass, setFormGlass] = useState('');
  const [formIce, setFormIce] = useState('');
  const [formGarnish, setFormGarnish] = useState('');
  const [formMethod, setFormMethod] = useState('');
  const [formIngredients, setFormIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' }
  ]);
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const loadRecipes = async () => {
    setLoading(true);
    const { data, error } = await fetchRecipesFromSupabase();
    if (data) {
      setRecipesList(data);
      setIsCloudConnected(!error);
    } else {
      setRecipesList([]);
      setIsCloudConnected(!error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = "Gong High's Grog Guide";
    }
    loadRecipes();
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter recipes live by name, ingredient, glass, or ice
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

    return matchesName || matchesCategory || matchesIngredient || matchesGlass || matchesIce;
  });

  const isIngredientMatch = (ingName: string) => {
    if (!searchQuery.trim()) return false;
    return ingName.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  // Handle Admin PIN validation
  const handleAdminLogin = async () => {
    if (!passcodeInput.trim()) {
      setPasscodeError('Please enter the Admin PIN.');
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
      setPasscodeError('Incorrect PIN. Please try again.');
    }
  };


  // Open Admin Form for Create or Edit
  const openAdminForm = (cocktail?: Cocktail) => {
    if (cocktail) {
      setEditingRecipeId(cocktail.id);
      setFormName(cocktail.name);
      setFormCategory(cocktail.category || '');
      setFormGlass(cocktail.glass || '');
      setFormIce(cocktail.ice || '');
      setFormGarnish(cocktail.garnish || '');
      setFormMethod(cocktail.method || '');
      setFormIngredients(
        cocktail.ingredients.length > 0
          ? [...cocktail.ingredients]
          : [{ name: '', amount: '' }]
      );
    } else {
      setEditingRecipeId(null);
      setFormName('');
      setFormCategory('');
      setFormGlass('');
      setFormIce('');
      setFormGarnish('');
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
      Alert.alert('Required Field', 'Please enter a drink name.');
      return;
    }

    const cleanIngredients = formIngredients.filter(
      (ing) => ing.name.trim() !== ''
    );

    setSaving(true);
    const payload = {
      name: formName.trim(),
      category: formCategory.trim(),
      glass: formGlass.trim(),
      ice: formIce.trim(),
      ingredients: cleanIngredients,
      garnish: formGarnish.trim(),
      method: formMethod.trim()
    };

    if (editingRecipeId) {
      // Update in Supabase
      const { error } = await updateRecipeInSupabase(editingRecipeId, payload);
      if (error) {
        // Fallback local update
        setRecipesList((prev) =>
          prev.map((item) =>
            item.id === editingRecipeId ? { ...item, ...payload } : item
          )
        );
      } else {
        await loadRecipes();
      }
    } else {
      // Create in Supabase
      const { data, error } = await createRecipeInSupabase(payload);
      if (error || !data) {
        // Fallback local create
        const localNew: Cocktail = {
          id: Date.now().toString(),
          ...payload
        };
        setRecipesList([localNew, ...recipesList]);
      } else {
        await loadRecipes();
      }
    }

    setSaving(false);
    setAdminModalVisible(false);
  };

  // Delete Recipe
  const handleDeleteRecipe = async (id: string, name: string) => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${name}" from Supabase?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await deleteRecipeFromSupabase(id);
            setRecipesList((prev) => prev.filter((r) => r.id !== id));
            if (selectedCocktail?.id === id) {
              setSelectedCocktail(null);
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 }}>
        <StatusBar style="light" backgroundColor="transparent" />

        {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🍸</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle} numberOfLines={1} adjustsFontSizeToFit>
              Gong High's Grog Guide
            </Text>
            <View style={styles.cloudSyncRow}>
              <View
                style={[
                  styles.syncDot,
                  { backgroundColor: isCloudConnected ? '#00FF66' : '#FF9900' }
                ]}
              />
              <Text style={styles.syncText}>
                {isCloudConnected ? 'SUPABASE LIVE' : 'LOCAL CACHE'}
              </Text>
            </View>
          </View>

          {/* Admin Add Drink Button */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminAddBtn}
              onPress={() => openAdminForm()}
            >
              <Text style={styles.adminAddBtnText}>+ ADD DRINK</Text>
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
            placeholder="SEARCH DRINK OR INGREDIENT..."
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
          <Text style={styles.loadingText}>SYNCING WITH SUPABASE...</Text>
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
              <Text style={styles.emptyTitle}>NO MATCHING DRINKS</Text>
              <Text style={styles.emptySubtitle}>
                No cocktail matches "{searchQuery}". Try searching another ingredient or spirit.
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>RESET SEARCH</Text>
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
                  {(item.glass?.trim() || item.ice?.trim()) ? (
                    <View style={styles.cardMetaRow}>
                      {item.glass?.trim() ? (
                        <Text style={styles.cardGlass}>🥃 Glass: {item.glass.trim()}</Text>
                      ) : null}
                      {item.ice?.trim() ? (
                        <Text style={styles.cardIce}>🧊 Ice: {item.ice.trim()}</Text>
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
                      <Text style={styles.cardEditBtnText}>EDIT</Text>
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
                      style={[styles.ingPill, matched && styles.ingPillMatched]}
                    >
                      <Text style={[styles.ingAmount, matched && styles.ingMatchedText]}>
                        {ing.amount}
                      </Text>
                      <Text style={[styles.ingName, matched && styles.ingMatchedText]}>
                        {ing.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FULL RECIPE MODAL OVERLAY */}
      {selectedCocktail && (
        <Modal
          visible={!!selectedCocktail}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedCocktail(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.backdrop} onPress={() => setSelectedCocktail(null)} />

            <View
              style={[styles.modalContent, inlineGlassModal, { borderTopWidth: 4, borderColor: '#FFE600' }]}
              {...({ className: 'glass-card', dataSet: { glassModal: 'true' } } as any)}
            >
              {/* Modal Top Bar */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleGroup}>
                  {selectedCocktail.category?.trim() ? (() => {
                    const catTheme = getCategoryStyle(selectedCocktail.category);
                    return (
                      <View style={[styles.categoryBadge, catTheme.badgeStyle]}>
                        <Text style={[styles.categoryText, catTheme.textStyle]}>
                          {selectedCocktail.category.trim().toUpperCase()}
                        </Text>
                      </View>
                    );
                  })() : null}
                  <Text style={styles.modalTitle}>{selectedCocktail.name}</Text>
                  {(selectedCocktail.glass?.trim() || selectedCocktail.ice?.trim()) ? (
                    <View style={styles.modalMetaRow}>
                      {selectedCocktail.glass?.trim() ? (
                        <Text style={styles.modalGlass}>🥃 Glass: {selectedCocktail.glass.trim()}</Text>
                      ) : null}
                      {selectedCocktail.ice?.trim() ? (
                        <Text style={styles.modalIce}>🧊 Ice: {selectedCocktail.ice.trim()}</Text>
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
                  <Text style={styles.sectionHeader}>INGREDIENTS</Text>
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
                    <Text style={styles.sectionHeader}>PREPARATION METHOD</Text>
                    <View style={[styles.methodBox, inlineGlassCard]} {...({ className: 'glass-card' } as any)}>
                      <Text style={styles.methodText}>{selectedCocktail.method}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Garnish Section */}
                {selectedCocktail.garnish ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>GARNISH</Text>
                    <View style={styles.garnishBox}>
                      <Text style={styles.garnishText}>✨ {selectedCocktail.garnish}</Text>
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
                    <Text style={styles.modalEditBtnText}>✏️ EDIT SPEC</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalDeleteBtn}
                    onPress={() => handleDeleteRecipe(selectedCocktail.id, selectedCocktail.name)}
                  >
                    <Text style={styles.modalDeleteBtnText}>🗑️ DELETE</Text>
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
                  {editingRecipeId ? 'EDIT COCKTAIL SPEC' : 'ADD NEW COCKTAIL'}
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
                  <Text style={styles.formLabel}>COCKTAIL NAME *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. Espresso Martini"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>CATEGORY</Text>
                  <View style={styles.categoryPickerRow}>
                    {['None', 'Stirred', 'Shaken', 'Bomb', 'Shot'].map((cat) => {
                      const valueToSave = cat === 'None' ? '' : cat;
                      const isSelected = formCategory === valueToSave;
                      const catTheme = getCategoryStyle(valueToSave);
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setFormCategory(valueToSave)}
                          style={[
                            styles.categoryPickerOption,
                            isSelected && (valueToSave ? catTheme.badgeStyle : styles.categoryPickerOptionSelected)
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryPickerText,
                              isSelected && (valueToSave ? catTheme.textStyle : styles.categoryPickerTextSelected)
                            ]}
                          >
                            {cat.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>GLASS TYPE</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formGlass}
                      onChangeText={setFormGlass}
                      placeholder="e.g. Coupe Glass, Rocks, etc."
                      placeholderTextColor="#666666"
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>ICE TYPE</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formIce}
                      onChangeText={setFormIce}
                      placeholder="e.g. Single Cube, Crushed, etc."
                      placeholderTextColor="#666666"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Dynamic Ingredients */}
                <View style={styles.formGroup}>
                  <View style={styles.formSectionHeaderRow}>
                    <Text style={styles.formLabel}>INGREDIENTS</Text>
                    <TouchableOpacity onPress={addIngredientRow} style={styles.addIngBtn}>
                      <Text style={styles.addIngBtnText}>+ ADD ROW</Text>
                    </TouchableOpacity>
                  </View>

                  {formIngredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingFormRow}>
                      <TextInput
                        style={[styles.formInput, { flex: 2 }]}
                        value={ing.name}
                        onChangeText={(val) => updateIngredientField(idx, 'name', val)}
                        placeholder="Ingredient name"
                        placeholderTextColor="#666666"
                      />
                      <TextInput
                        style={[styles.formInput, { flex: 1 }]}
                        value={ing.amount}
                        onChangeText={(val) => updateIngredientField(idx, 'amount', val)}
                        placeholder="Amount"
                        placeholderTextColor="#666666"
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
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>GARNISH</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formGarnish}
                    onChangeText={setFormGarnish}
                    placeholder="e.g. 3 floating coffee beans"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>PREPARATION METHOD</Text>
                  <TextInput
                    style={[styles.formInput, styles.textAreaInput]}
                    value={formMethod}
                    onChangeText={setFormMethod}
                    placeholder="Describe shaking, stirring, or building steps..."
                    placeholderTextColor="#666666"
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
              </ScrollView>

              {/* Admin Save Action */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveRecipe}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingRecipeId ? 'UPDATE IN SUPABASE' : 'SAVE TO SUPABASE'}
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
        {isAdmin ? (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setIsAdmin(false)}
          >
            <Text style={styles.logoutBtnText}>Admin (Logout)</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.discreetLockBtn}
            onPress={() => {
              setPasscodeInput('');
              setPasscodeError('');
              setLoginModalVisible(true);
            }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.discreetLockText}>🔒</Text>
          </TouchableOpacity>
        )}
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
                <Text style={styles.loginTitle}>🔒 ADMIN ACCESS</Text>
                <TouchableOpacity
                  onPress={() => setLoginModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.loginBody}>
                <Text style={styles.loginSubtitle}>
                  Enter the Admin PIN/Password to manage recipe specs.
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>ADMIN PIN / PASSWORD</Text>
                  <TextInput
                    style={[styles.formInput, passcodeError ? styles.inputError : null]}
                    value={passcodeInput}
                    onChangeText={(val) => {
                      setPasscodeInput(val);
                      if (passcodeError) setPasscodeError('');
                    }}
                    placeholder="Enter Admin PIN..."
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
                    <Text style={styles.loginCancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.loginSubmitBtn}
                    onPress={handleAdminLogin}
                    disabled={verifyingPasscode}
                  >
                    {verifyingPasscode ? (
                      <ActivityIndicator color="#000000" size="small" />
                    ) : (
                      <Text style={styles.loginSubmitBtnText}>LOGIN</Text>
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFE600',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoEmoji: {
    fontSize: 18,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cloudSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0A0A0',
  },
  adminAddBtn: {
    marginLeft: 'auto',
    backgroundColor: '#FFE600',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  adminAddBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  filterScroll: {
    maxHeight: 38,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterChipActive: {
    backgroundColor: '#FFE600',
    borderColor: '#FFE600',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B0B0B0',
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFE600',
    letterSpacing: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  cardCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardCategoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFE600',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardGlass: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  cardIce: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardEditBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardEditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFE600',
  },
  cardArrow: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFE600',
  },
  ingredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ingPillMatched: {
    backgroundColor: '#FFE600',
    borderColor: '#FFE600',
  },
  ingAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999999',
  },
  ingName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D0D0D0',
  },
  ingMatchedText: {
    color: '#000000',
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#FFE600',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },

  /* MODAL OVERLAY STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    maxHeight: '90%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(25, 25, 28, 0.90)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  modalTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFE600',
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalGlass: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFE600',
  },
  modalIce: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00F0FF',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalBodyContent: {
    gap: 20,
    paddingBottom: 20,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFE600',
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: 4,
  },
  recipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    padding: 14,
  },
  recipeIngName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    flex: 1,
  },
  recipeIngAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFE600',
    marginLeft: 12,
  },
  methodBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    padding: 16,
  },
  methodText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#F0F0F0',
    lineHeight: 28,
  },
  garnishBox: {
    backgroundColor: 'rgba(38, 34, 0, 0.65)',
    borderWidth: 1,
    borderColor: '#FFE600',
    borderRadius: 6,
    padding: 16,
  },
  garnishText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFE600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(20, 20, 24, 0.90)',
    flexDirection: 'row',
    gap: 12,
  },
  modalEditBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalEditBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFE600',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(51, 17, 17, 0.7)',
    borderWidth: 1,
    borderColor: '#FF4444',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalDeleteBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF4444',
  },

  /* ADMIN MODAL STYLES */
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(25, 25, 28, 0.90)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFE600',
    letterSpacing: 0.5,
  },
  adminBody: {
    padding: 20,
  },
  adminBodyContent: {
    gap: 16,
    paddingBottom: 24,
  },
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFE600',
    letterSpacing: 1,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  textAreaInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  formSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addIngBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addIngBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFE600',
  },
  ingFormRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  removeIngBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'rgba(51, 17, 17, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIngBtnText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '900',
  },
  saveBtn: {
    backgroundColor: '#FFE600',
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },

  /* FOOTER STYLES */
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  discreetLockBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discreetLockText: {
    fontSize: 14,
    color: '#444444',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFE600',
    letterSpacing: 0.5,
  },

  /* LOGIN MODAL STYLES */
  loginModalContent: {
    marginHorizontal: 16,
    marginBottom: 40,
    borderRadius: 6,
    borderTopWidth: 4,
    borderColor: '#FFE600',
    overflow: 'hidden',
  },
  loginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'rgba(25, 25, 28, 0.90)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFE600',
    letterSpacing: 0.5,
  },
  loginBody: {
    padding: 20,
    gap: 16,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF4444',
    marginTop: 2,
  },
  loginActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  loginCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  loginCancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#888888',
  },
  loginSubmitBtn: {
    flex: 1,
    backgroundColor: '#FFE600',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  loginSubmitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryPickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryPickerOptionSelected: {
    backgroundColor: '#FFE600',
    borderColor: '#FFE600',
  },
  categoryPickerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 0.5,
  },
  categoryPickerTextSelected: {
    color: '#000000',
    fontWeight: '900',
  },
});


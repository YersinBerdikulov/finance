import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme, useTransactions, useCurrency, useLanguage } from '../App';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../shared/i18n';

const { width } = Dimensions.get('window');

type Transaction = {
  id: number;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  desc?: string;
  date: string | number | Date;
};

const categories = [
  'category_salary',
  'category_freelance',
  'category_scholarship',
  'category_sidejob',
  'category_dividends',
  'category_debt_return',
  'category_sale',
  'category_cashback',
  'category_gift',
  'category_deposit',
  'category_other',
];

const expenseCategories = [
  'category_groceries',
  'category_cafe',
  'category_transport',
  'category_rent',
  'category_utilities',
  'category_communication',
  'category_entertainment',
  'category_gifts',
  'category_debts',
  'category_clothes',
  'category_barbershop',
  'category_health',
  'category_education',
  'category_shopping',
  'category_travel',
  'category_credit',
  'category_insurance',
  'category_other',
];

const HomeScreen = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { transactions, setTransactions } = useTransactions();
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [dateType, setDateType] = useState('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [showCategories, setShowCategories] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDateType, setExpenseDateType] = useState('today');
  const [showExpenseCategories, setShowExpenseCategories] = useState(false);
  const [showExpenseDatePicker, setShowExpenseDatePicker] = useState(false);
  const [expenseCustomDate, setExpenseCustomDate] = useState(new Date());
  const [selectedTx, setSelectedTx] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTxId, setEditTxId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => { i18n.locale = language; }, [language]);

  const monthNames = i18n.t('months');

  // Загрузка транзакций при запуске
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('transactions');
      if (saved) setTransactions(JSON.parse(saved));
    })();
  }, []);

  // Сохранение транзакций при изменении
  useEffect(() => {
    AsyncStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAddIncome = () => {
    if (!amount || !category) return;
    setTransactions([
      {
        type: 'income',
        amount,
        category,
        desc,
        date: dateType === 'today'
          ? new Date()
          : dateType === 'yesterday'
          ? new Date(Date.now() - 86400000)
          : customDate,
        id: Date.now() + Math.random(),
      },
      ...transactions,
    ]);
    setAmount('');
    setCategory('');
    setDesc('');
    setDateType('today');
    setModalVisible(false);
  };

  const handleAddExpense = () => {
    if (!expenseAmount || !expenseCategory) return;
    setTransactions([
      {
        type: 'expense',
        amount: expenseAmount,
        category: expenseCategory,
        desc: expenseDesc,
        date: expenseDateType === 'today'
          ? new Date()
          : expenseDateType === 'yesterday'
          ? new Date(Date.now() - 86400000)
          : expenseCustomDate,
        id: Date.now() + Math.random(),
      },
      ...transactions,
    ]);
    setExpenseAmount('');
    setExpenseCategory('');
    setExpenseDesc('');
    setExpenseDateType('today');
    setExpenseModalVisible(false);
  };

  // Сортировка транзакций по дате (от новых к старым)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const sortedTransactions: Transaction[] = [...transactions]
    .filter((tx: Transaction) => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Вычисление баланса
  const balance = transactions.reduce((acc, tx) => acc + (tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount)), 0);
  const getBalanceColor = () => {
    if (balance > 0) return '#fff';
    if (balance < 0) return '#fff';
    return '#fff';
  };

  // Функция форматирования чисел с пробелами
  const formatAmount = (num) => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Открыть окно редактирования
  const handleEditTx = () => {
    if (!selectedTx) return;
    if (selectedTx.type === 'income') {
      setAmount(selectedTx.amount);
      setCategory(selectedTx.category);
      setDesc(selectedTx.desc);
      setDateType('other');
      setCustomDate(new Date(selectedTx.date));
      setModalVisible(true);
    } else {
      setExpenseAmount(selectedTx.amount);
      setExpenseCategory(selectedTx.category);
      setExpenseDesc(selectedTx.desc);
      setExpenseDateType('other');
      setExpenseCustomDate(new Date(selectedTx.date));
      setExpenseModalVisible(true);
    }
    setEditMode(true);
    setEditTxId(selectedTx.id);
    setShowTxModal(false);
  };

  // Сохранить изменения
  const handleSaveEdit = () => {
    if (editTxId && editMode) {
      setTransactions(transactions.map(tx => {
        if (tx.id !== editTxId) return tx;
        if (tx.type === 'income') {
          return {
            ...tx,
            amount,
            category,
            desc,
            date: dateType === 'today'
              ? new Date()
              : dateType === 'yesterday'
              ? new Date(Date.now() - 86400000)
              : customDate,
          };
        } else {
          return {
            ...tx,
            amount: expenseAmount,
            category: expenseCategory,
            desc: expenseDesc,
            date: expenseDateType === 'today'
              ? new Date()
              : expenseDateType === 'yesterday'
              ? new Date(Date.now() - 86400000)
              : expenseCustomDate,
          };
        }
      }));
      setEditMode(false);
      setEditTxId(null);
      setModalVisible(false);
      setExpenseModalVisible(false);
      setAmount('');
      setCategory('');
      setDesc('');
      setDateType('today');
      setExpenseAmount('');
      setExpenseCategory('');
      setExpenseDesc('');
      setExpenseDateType('today');
    }
  };

  // Валидация для дохода
  const isIncomeValid = amount && category && desc && Number(amount) > 0;
  // Валидация для расхода
  const isExpenseValid = expenseAmount && expenseCategory && expenseDesc && Number(expenseAmount) > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Баланс */}
      <View style={[styles.balanceCard, { backgroundColor: '#8e9cfb' }]}>
        <Text style={[styles.balanceLabel, { color: '#fff' }]}>{i18n.t('current_balance')}</Text>
        <Text style={[styles.balanceValue, { color: getBalanceColor() }]}> 
          {balance > 0 ? '' : ''}{formatAmount(balance)} <Text style={styles.balanceCurrency}>{currency}</Text>
        </Text>
        <TouchableOpacity style={[styles.moonIconWrap, { backgroundColor: theme.moonBg }]} onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="settings" size={32} color={theme.moonIcon} style={styles.moonIcon} />
        </TouchableOpacity>
      </View>
      {/* Кнопки */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#1ecb81' }]} onPress={() => setModalVisible(true)}>
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>{`+ ${i18n.t('income')}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ff5e62' }]} onPress={() => setExpenseModalVisible(true)}>
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>{`– ${i18n.t('expense')}`}</Text>
        </TouchableOpacity>
      </View>
      {/* История транзакций */}
      <View style={[styles.historyCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.historyTitle, { color: theme.text }]}>{i18n.t('transactions_this_month')}</Text>
        {sortedTransactions.length === 0 ? (
          <View style={styles.historyEmptyWrap}>
            <Text style={[styles.historyEmpty, { color: theme.textSecondary }]}>{i18n.t('no_transactions')}</Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 370 }}>
            {sortedTransactions.map(tx => {
              const d = new Date(tx.date);
              return (
                <TouchableOpacity key={tx.id} onPress={() => { setSelectedTx(tx); setShowTxModal(true); }}>
                  <View style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txDesc, { color: theme.text }]}>{tx.desc || tx.category}</Text>
                      <View style={styles.txMetaRow}>
                        <View style={[styles.txCategoryPill, { backgroundColor: tx.type === 'income' ? 'rgba(30,203,129,0.15)' : 'rgba(255,94,98,0.15)' }]}> 
                          <Text style={[styles.txCategoryText, { color: tx.type === 'income' ? '#1ecb81' : '#ff5e62' }]}>{i18n.t(tx.category)}</Text>
                        </View>
                        <Text style={styles.txDate}>{d.getDate()} {monthNames[d.getMonth()]}</Text>
                      </View>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#1ecb81' : '#ff5e62' }]}> 
                      {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)} {currency}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
      {/* Модальное окно "Новый доход" */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#232634' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{i18n.t('new_income')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('amount')}</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: !amount && !isIncomeValid ? '#ff5e62' : isDark ? '#444' : '#ddd', fontSize: 22, height: 56 }]}
              placeholder={i18n.t('enter_amount')}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}
              maxLength={10}
            />
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('category')}</Text>
            <Pressable
              style={[styles.input, { color: theme.text, borderColor: !category && !isIncomeValid ? '#ff5e62' : isDark ? '#444' : '#ddd', fontSize: 20, height: 56 }]}
              onPress={() => setShowCategories(true)}
            >
              <Text style={{ color: category ? theme.text : theme.textSecondary, fontSize: 20 }}>{category ? i18n.t(category) : i18n.t('select_category')}</Text>
            </Pressable>
            {showCategories && (
              <View style={[styles.dropdown, { backgroundColor: isDark ? '#232634' : '#fff', borderColor: isDark ? '#444' : '#ddd' }]}> 
                <ScrollView style={{ maxHeight: 160 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.dropdownItem}
                      onPress={() => { setCategory(cat); setShowCategories(false); }}
                    >
                      <Text style={{ color: theme.text, fontSize: 20 }}>{i18n.t(cat)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('description')}</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: (!desc && !isIncomeValid) ? '#ff5e62' : (isDark ? '#444' : '#ddd'), fontSize: 20, height: 56 }]}
              placeholder={i18n.t('enter_description')}
              placeholderTextColor={theme.textSecondary}
              value={desc}
              onChangeText={setDesc}
              maxLength={40}
            />
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('date')}</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, dateType === 'today' && [styles.dateBtnActive, { backgroundColor: theme.accent }]]}
                onPress={() => setDateType('today')}
              >
                <Text style={[styles.dateBtnText, { color: theme.text }, dateType === 'today' && { color: '#fff', fontWeight: 'bold' }]}>{i18n.t('today')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateBtn, dateType === 'yesterday' && [styles.dateBtnActive, { backgroundColor: theme.accent }]]}
                onPress={() => setDateType('yesterday')}
              >
                <Text style={[styles.dateBtnText, { color: theme.text }, dateType === 'yesterday' && { color: '#fff', fontWeight: 'bold' }]}>{i18n.t('yesterday')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateBtn, dateType === 'other' && [styles.dateBtnActive, { backgroundColor: theme.accent }]]}
                onPress={() => setDateType('other')}
              >
                <Text style={[styles.dateBtnText, { color: dateType === 'other' ? '#fff' : theme.text, fontWeight: dateType === 'other' ? 'bold' : 'normal' }]}>{i18n.t('other_date')}</Text>
              </TouchableOpacity>
            </View>
            {dateType === 'other' && (
              <TouchableOpacity style={styles.customDateWrap} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.customDateText, { color: theme.text }]}>{customDate ? customDate.toLocaleDateString('ru-RU') : i18n.t('pick_date')}</Text>
              </TouchableOpacity>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={customDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setCustomDate(selectedDate);
                }}
              />
            )}
            
            {showEditDatePicker && (
              <DateTimePicker
                value={customDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEditDatePicker(false);
                  if (selectedDate) setCustomDate(selectedDate);
                }}
              />
            )}
            <TouchableOpacity style={[styles.saveBtn, !isIncomeValid && styles.addBtnDisabled]} onPress={editMode ? handleSaveEdit : handleAddIncome} disabled={!isIncomeValid}>
              <Text style={styles.saveBtnText}>{editMode ? i18n.t('save') : i18n.t('add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Модальное окно "Новый расход" */}
      <Modal
        visible={expenseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#232634' : '#fff' }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{i18n.t('new_expense')}</Text>
              <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('amount')}</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: !expenseAmount && !isExpenseValid ? '#ff5e62' : isDark ? '#444' : '#ddd', fontSize: 22, height: 56 }]}
              placeholder={i18n.t('enter_amount')}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={v => setExpenseAmount(v.replace(/[^0-9]/g, ''))}
              maxLength={10}
            />
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('category')}</Text>
            <Pressable
              style={[styles.input, { color: theme.text, borderColor: !expenseCategory && !isExpenseValid ? '#ff5e62' : isDark ? '#444' : '#ddd', fontSize: 20, height: 56 }]}
              onPress={() => setShowExpenseCategories(true)}
            >
              <Text style={{ color: expenseCategory ? theme.text : theme.textSecondary, fontSize: 20 }}>{expenseCategory ? i18n.t(expenseCategory) : i18n.t('select_category')}</Text>
            </Pressable>
            {showExpenseCategories && (
              <View style={[styles.dropdown, { backgroundColor: isDark ? '#232634' : '#fff', borderColor: isDark ? '#444' : '#ddd' }]}> 
                <ScrollView style={{ maxHeight: 160 }}>
                  {expenseCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.dropdownItem}
                      onPress={() => { setExpenseCategory(cat); setShowExpenseCategories(false); }}
                    >
                      <Text style={{ color: theme.text, fontSize: 20 }}>{i18n.t(cat)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('description')}</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: (!expenseDesc && !isExpenseValid) ? '#ff5e62' : (isDark ? '#444' : '#ddd'), fontSize: 20, height: 56 }]}
              placeholder={i18n.t('enter_description')}
              placeholderTextColor={theme.textSecondary}
              value={expenseDesc}
              onChangeText={setExpenseDesc}
              maxLength={40}
            />
            <Text style={[styles.modalLabel, { color: theme.text }]}>{i18n.t('date')}</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, expenseDateType === 'today' && [styles.dateBtnActive, { backgroundColor: theme.accent }]]}
                onPress={() => setExpenseDateType('today')}
              >
                <Text style={[styles.dateBtnText, { color: theme.text }, expenseDateType === 'today' && { color: '#fff', fontWeight: 'bold' }]}>{i18n.t('today')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateBtn, expenseDateType === 'yesterday' && [styles.dateBtnActive, { backgroundColor: theme.accent }]]}
                onPress={() => setExpenseDateType('yesterday')}
              >
                <Text style={[styles.dateBtnText, { color: theme.text }, expenseDateType === 'yesterday' && { color: '#fff', fontWeight: 'bold' }]}>{i18n.t('yesterday')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateBtn, expenseDateType === 'other' && [styles.dateBtnActive, { backgroundColor: theme.accent }]]}
                onPress={() => setExpenseDateType('other')}
              >
                <Text style={[styles.dateBtnText, { color: expenseDateType === 'other' ? '#fff' : theme.text, fontWeight: expenseDateType === 'other' ? 'bold' : 'normal' }]}>{i18n.t('other_date')}</Text>
              </TouchableOpacity>
            </View>
            {expenseDateType === 'other' && (
              <TouchableOpacity style={styles.customDateWrap} onPress={() => setShowExpenseDatePicker(true)}>
                <Text style={[styles.customDateText, { color: theme.text }]}>{expenseCustomDate ? expenseCustomDate.toLocaleDateString('ru-RU') : i18n.t('pick_date')}</Text>
              </TouchableOpacity>
            )}
            {showExpenseDatePicker && (
              <DateTimePicker
                value={expenseCustomDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowExpenseDatePicker(false);
                  if (selectedDate) setExpenseCustomDate(selectedDate);
                }}
              />
            )}
            <TouchableOpacity style={[styles.addBtn, !isExpenseValid && styles.addBtnDisabled, { backgroundColor: theme.expense }]} onPress={editMode ? handleSaveEdit : handleAddExpense} disabled={!isExpenseValid}>
              <Text style={[styles.addBtnText, { fontSize: 22 }]}>{editMode ? i18n.t('save') : i18n.t('add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Модальное окно просмотра транзакции */}
      <Modal
        visible={showTxModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTxModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: theme.card, minHeight: 180, padding: 16, width: '100%', maxWidth: undefined, alignSelf: 'center' }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.monthTitle, { color: theme.text }]}>{i18n.t('transaction')}</Text>
              <TouchableOpacity onPress={() => setShowTxModal(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            {selectedTx && (
              <View style={{ borderRadius: 14, backgroundColor: theme.background, padding: 12, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.txDesc, { color: theme.text }]}>{selectedTx.desc || selectedTx.category}</Text>
                  <Text style={[styles.txAmount, { color: selectedTx.type === 'income' ? '#1ecb81' : '#ff5e62' }]}> 
                    {selectedTx.type === 'income' ? '+' : '-'}{formatAmount(selectedTx.amount)} {currency}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <View style={[styles.txCategoryPill, { backgroundColor: selectedTx.type === 'income' ? 'rgba(30,203,129,0.15)' : 'rgba(255,94,98,0.15)' }]}> 
                    <Text style={[styles.txCategoryText, { color: selectedTx.type === 'income' ? '#1ecb81' : '#ff5e62' }]}>{i18n.t(selectedTx.category)}</Text>
                  </View>
                  <Text style={styles.txDate}>{(() => { const d = new Date(selectedTx.date); return `${d.getDate()} ${monthNames[d.getMonth()]}`; })()}</Text>
                </View>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#ff5e62' }]}
                onPress={() => {
                  setTransactions(transactions.filter(tx => tx.id !== selectedTx.id));
                  setShowTxModal(false);
                }}>
                <Text style={styles.modalActionBtnText}>{i18n.t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Модальное окно редактирования */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: theme.card, minHeight: 180, padding: 16, width: '100%', maxWidth: undefined, alignSelf: 'center' }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.monthTitle, { color: theme.text }]}>Редактировать</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.accent, borderWidth: 2, borderRadius: 12, fontSize: 18, height: 48, marginBottom: 8, paddingHorizontal: 14 }}
              placeholder="Сумма"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={editAmount}
              onChangeText={v => setEditAmount(v.replace(/[^0-9]/g, ''))}
              maxLength={10}
            />
            <TextInput
              style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.accent, borderWidth: 2, borderRadius: 12, fontSize: 18, height: 48, marginBottom: 8, paddingHorizontal: 14 }}
              placeholder="Категория"
              placeholderTextColor={theme.textSecondary}
              value={editCategory}
              onChangeText={setEditCategory}
              maxLength={20}
            />
            <TextInput
              style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.accent, borderWidth: 2, borderRadius: 12, fontSize: 18, height: 48, marginBottom: 8, paddingHorizontal: 14 }}
              placeholder="Описание (необязательно)"
              placeholderTextColor={theme.textSecondary}
              value={editDesc}
              onChangeText={setEditDesc}
              maxLength={40}
            />
            
            {showEditDatePicker && (
              <DateTimePicker
                value={editDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEditDatePicker(false);
                  if (selectedDate) setEditDate(selectedDate);
                }}
              />
            )}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.accent, shadowColor: theme.accent },
              ]}
              activeOpacity={0.8}
              onPress={async () => {
                if (!editAmount || !editCategory) return;
                const newTxs = transactions.map(tx =>
                  tx.id === editTxId
                    ? { ...tx, amount: editAmount, category: editCategory, desc: editDesc, date: editDate }
                    : tx
                );
                setTransactions(newTxs);
                await AsyncStorage.setItem('transactions', JSON.stringify(newTxs));
                setShowEditModal(false);
                setEditMode(false);
                setEditTxId(null);
              }}
            >
              <Text style={styles.saveBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showSettingsModal && (
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
            <View style={{ backgroundColor: theme.card, borderRadius: 28, padding: 28, width: '90%', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, elevation: 12, position: 'relative' }}>
              {/* Кнопка закрытия */}
              <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }} onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: theme.text, marginBottom: 24, alignSelf: 'center', letterSpacing: 0.5 }}>{i18n.t('settings')}</Text>
              {/* Theme Switch */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="theme-light-dark" size={22} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 17, color: theme.text, fontWeight: 'bold' }}>{i18n.t('theme')}</Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 10 }}>{language === 'ru' ? 'Выберите тему оформления' : 'Choose app theme'}</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: !isDark ? theme.accent : theme.background,
                      borderWidth: 2,
                      borderColor: !isDark ? theme.accent : theme.textSecondary,
                      marginRight: 8,
                      alignItems: 'center',
                      transform: [{ scale: !isDark ? 1.06 : 1 }],
                      shadowColor: !isDark ? theme.accent : 'transparent',
                      shadowOpacity: !isDark ? 0.18 : 0,
                      shadowRadius: !isDark ? 8 : 0,
                      elevation: !isDark ? 4 : 0,
                    }}
                    onPress={() => { if (isDark) toggleTheme(); }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="sunny" size={22} color={!isDark ? '#fff' : theme.textSecondary} style={{ marginBottom: 2 }} />
                    <Text style={{ color: !isDark ? '#fff' : theme.text }}>{i18n.t('light')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: isDark ? theme.accent : theme.background,
                      borderWidth: 2,
                      borderColor: isDark ? theme.accent : theme.textSecondary,
                      alignItems: 'center',
                      transform: [{ scale: isDark ? 1.06 : 1 }],
                      shadowColor: isDark ? theme.accent : 'transparent',
                      shadowOpacity: isDark ? 0.18 : 0,
                      shadowRadius: isDark ? 8 : 0,
                      elevation: isDark ? 4 : 0,
                    }}
                    onPress={() => { if (!isDark) toggleTheme(); }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="moon" size={22} color={isDark ? '#fff' : theme.textSecondary} style={{ marginBottom: 2 }} />
                    <Text style={{ color: isDark ? '#fff' : theme.text }}>{i18n.t('dark')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: theme.textSecondary, opacity: 0.12, marginVertical: 10 }} />
              {/* Language Switch */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="language" size={22} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 17, color: theme.text, fontWeight: 'bold' }}>{i18n.t('language')}</Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 10 }}>{language === 'ru' ? 'Выберите язык приложения' : 'Choose app language'}</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: language === 'ru' ? theme.accent : theme.background,
                      borderWidth: 2,
                      borderColor: language === 'ru' ? theme.accent : theme.textSecondary,
                      marginRight: 8,
                      alignItems: 'center',
                      transform: [{ scale: language === 'ru' ? 1.06 : 1 }],
                      shadowColor: language === 'ru' ? theme.accent : 'transparent',
                      shadowOpacity: language === 'ru' ? 0.18 : 0,
                      shadowRadius: language === 'ru' ? 8 : 0,
                      elevation: language === 'ru' ? 4 : 0,
                    }}
                    onPress={() => setLanguage('ru')}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: language === 'ru' ? '#fff' : theme.text }}>{i18n.t('russian')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: language === 'en' ? theme.accent : theme.background,
                      borderWidth: 2,
                      borderColor: language === 'en' ? theme.accent : theme.textSecondary,
                      alignItems: 'center',
                      transform: [{ scale: language === 'en' ? 1.06 : 1 }],
                      shadowColor: language === 'en' ? theme.accent : 'transparent',
                      shadowOpacity: language === 'en' ? 0.18 : 0,
                      shadowRadius: language === 'en' ? 8 : 0,
                      elevation: language === 'en' ? 4 : 0,
                    }}
                    onPress={() => setLanguage('en')}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: language === 'en' ? '#fff' : theme.text }}>{i18n.t('english')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: theme.textSecondary, opacity: 0.12, marginVertical: 10 }} />
              {/* Currency Switch */}
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <FontAwesome5 name="money-bill-wave" size={20} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 17, color: theme.text, fontWeight: 'bold' }}>{i18n.t('currency')}</Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 10 }}>{language === 'ru' ? 'Выберите валюту для отображения' : 'Choose display currency'}</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {['₸', '$', '€', '₽'].map((cur) => (
                    <TouchableOpacity
                      key={cur}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        borderRadius: 16,
                        backgroundColor: currency === cur ? theme.accent : theme.background,
                        borderWidth: 2,
                        borderColor: currency === cur ? theme.accent : theme.textSecondary,
                        marginRight: cur !== '₽' ? 8 : 0,
                        alignItems: 'center',
                        transform: [{ scale: currency === cur ? 1.06 : 1 }],
                        shadowColor: currency === cur ? theme.accent : 'transparent',
                        shadowOpacity: currency === cur ? 0.18 : 0,
                        shadowRadius: currency === cur ? 8 : 0,
                        elevation: currency === cur ? 4 : 0,
                      }}
                      onPress={() => setCurrency(cur as any)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: currency === cur ? '#fff' : theme.text, fontSize: 18 }}>{cur}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const CARD_RADIUS = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
  },
  balanceCard: {
    width: width * 0.9,
    borderRadius: CARD_RADIUS,
    padding: 24,
    marginBottom: 18,
    position: 'relative',
    shadowColor: '#8e9cfb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 12,
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: 'bold',
  },
  balanceCurrency: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  moonIconWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 20,
    padding: 4,
    shadowColor: '#8e9cfb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  moonIcon: {
    color: '#fbc02d',
  },
  buttonsRow: {
    flexDirection: 'row',
    width: width * 0.9,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyCard: {
    width: width * 0.9,
    borderRadius: CARD_RADIUS,
    padding: 18,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  historyEmptyWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  historyEmpty: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    minHeight: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalLabel: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    fontSize: 20,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  dateRow: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'space-between',
  },
  dateBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  dateBtnActive: {
    backgroundColor: '#8e9cfb',
  },
  dateBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  dateBtnTextActive: {
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#1ecb81',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  customDateWrap: {
    borderWidth: 2,
    borderColor: '#8e9cfb',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  customDateText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  dropdown: {
    borderWidth: 2,
    borderRadius: 14,
    marginTop: -8,
    marginBottom: 8,
    overflow: 'hidden',
    maxHeight: 160,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180,180,180,0.08)',
  },
  txDesc: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  txCategoryPill: {
    backgroundColor: 'rgba(120,120,150,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 10,
  },
  txCategoryText: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  txDate: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  txAmount: {
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 10,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 6,
    marginTop: 8,
  },
  modalActionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  editDateField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  saveBtn: {
    backgroundColor: '#8e9cfb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8e9cfb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default HomeScreen; 
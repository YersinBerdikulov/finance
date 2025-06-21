import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, Modal, Pressable } from 'react-native';
import { useTheme, useTransactions, useCurrency, useLanguage } from '../App';
import { useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
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

type GroupedTransactions = {
  [key: string]: Transaction[];
};

// Получаем транзакции из AsyncStorage (или через пропсы/контекст, если вынесено)
const getTransactions = async (): Promise<Transaction[]> => {
  const saved = await AsyncStorage.getItem('transactions');
  return saved ? JSON.parse(saved) : [];
};

const formatAmount = (num: number | string): string => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const OperationsScreen = () => {
  const { theme } = useTheme();
  const { transactions, setTransactions } = useTransactions() as { transactions: Transaction[], setTransactions: (txs: Transaction[]) => void };
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditCategories, setShowEditCategories] = useState(false);
  const { currency } = useCurrency();
  const { language } = useLanguage();

  useEffect(() => { i18n.locale = language; }, [language]);

  const monthNames = i18n.t('months', { locale: language });

  // Автообновление при возврате на экран
  useFocusEffect(
    React.useCallback(() => {
      getTransactions().then(setTransactions);
    }, [])
  );

  // Фильтрация и поиск
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filter === 'income' && tx.type !== 'income') return false;
      if (filter === 'expense' && tx.type !== 'expense') return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const descMatch = tx.desc && tx.desc.toLowerCase().includes(searchLower);
        const catOrig = tx.category.toLowerCase();
        const catTrans = i18n.t(`category_${tx.category}`, { locale: language }).toLowerCase();
        const catMatch = catOrig.includes(searchLower) || (catTrans !== `category_${tx.category}` && catTrans.includes(searchLower));
        if (!descMatch && !catMatch) return false;
      }
      return true;
    });
  }, [transactions, filter, search, language]);

  // Группировка по месяцам
  const grouped = useMemo(() => {
    const groups: GroupedTransactions = {};
    (filtered as Transaction[]).forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    // Сортировка по убыванию месяца
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Функция для сравнения дат
  const compareDates = (a: Transaction, b: Transaction) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <TextInput
        style={[styles.search, { backgroundColor: theme.card, color: theme.text, marginTop: 16 }]}
        placeholder={i18n.t('search_placeholder')}
        placeholderTextColor={theme.textSecondary}
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, filter === 'all' && [styles.filterBtnActive, { backgroundColor: theme.accent }]]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterBtnText, filter === 'all' && { color: '#fff', fontWeight: 'bold' }]}>{i18n.t('all')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'income' && [styles.filterBtnActive, { backgroundColor: '#1ecb81' }]]} onPress={() => setFilter('income')}>
          <Text style={[styles.filterBtnText, filter === 'income' && { color: '#fff', fontWeight: 'bold' }]}>{i18n.t('income')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'expense' && [styles.filterBtnActive, { backgroundColor: '#ff5e62' }]]} onPress={() => setFilter('expense')}>
          <Text style={[styles.filterBtnText, filter === 'expense' && { color: '#fff', fontWeight: 'bold' }]}>{i18n.t('expense')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ marginTop: 10 }}>
        {grouped.map(([key, txs]) => {
          const d = new Date(txs[0].date);
          const month = monthNames[d.getMonth()];
          const year = d.getFullYear();
          const incomeSum = txs.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0);
          const expenseSum = txs.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0);
          return (
            <View key={key} style={[styles.monthBlock, { backgroundColor: theme.card }]}> 
              <View style={styles.monthHeader}>
                <Text style={[styles.monthTitle, { color: theme.text }]}>{month} {year}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {(filter === 'all' || filter === 'income') && incomeSum > 0 && (
                    <View style={[styles.monthSumPill, { backgroundColor: '#1ecb81' }]}> 
                      <Text style={[styles.monthSumText]}>+{formatAmount(incomeSum)} {currency}</Text>
                    </View>
                  )}
                  {(filter === 'all' || filter === 'expense') && expenseSum > 0 && (
                    <View style={[styles.monthSumPill, { backgroundColor: '#ff5e62', marginLeft: 8 }]}> 
                      <Text style={[styles.monthSumText]}>-{formatAmount(expenseSum)} {currency}</Text>
                    </View>
                  )}
                </View>
              </View>
              {txs.sort(compareDates).map(tx => (
                <View key={tx.id} style={[styles.txCard, { borderLeftColor: tx.type === 'income' ? '#1ecb81' : '#ff5e62', backgroundColor: theme.background }]}> 
                  <TouchableOpacity onPress={() => { setSelectedTx(tx); setShowTxModal(true); }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.txDesc, { color: theme.text }]}>{tx.desc || tx.category}</Text>
                      <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#1ecb81' : '#ff5e62' }]}> 
                        {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)} {currency}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <View style={[styles.txCategoryPill, { backgroundColor: tx.type === 'income' ? 'rgba(30,203,129,0.15)' : 'rgba(255,94,98,0.15)' }]}> 
                        <Text style={[styles.txCategoryText, { color: tx.type === 'income' ? '#1ecb81' : '#ff5e62' }]}>{i18n.t(tx.category)}</Text>
                      </View>
                      <Text style={styles.txDate}>
                        {(() => { const d = new Date(tx.date); return `${d.getDate()} ${monthNames[d.getMonth()]}`; })()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Модальное окно транзакции */}
      <Modal
        visible={showTxModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTxModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
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
                  <Text style={styles.txDate}>
                    {(() => { const d = new Date(selectedTx.date); return `${d.getDate()} ${monthNames[d.getMonth()]}`; })()}
                  </Text>
                </View>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: theme.accent }]}
                onPress={() => {
                  if (!selectedTx) return;
                  setEditAmount(selectedTx.amount);
                  setEditCategory(selectedTx.category);
                  setEditDesc(selectedTx.desc || '');
                  setEditDate(new Date(selectedTx.date));
                  setEditMode(true);
                  setShowEditModal(true);
                  setShowTxModal(false);
                }}>
                <Text style={styles.modalActionBtnText}>{i18n.t('edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#ff5e62' }]}
                onPress={async () => {
                  if (!selectedTx) return;
                  const newTxs = transactions.filter(tx => tx.id !== selectedTx.id);
                  setTransactions(newTxs);
                  await AsyncStorage.setItem('transactions', JSON.stringify(newTxs));
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
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: theme.card, minHeight: 180, padding: 16, width: '100%', maxWidth: undefined, alignSelf: 'center' }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.monthTitle, { color: theme.text }]}>{i18n.t('edit')}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.accent, borderWidth: 2, borderRadius: 12, fontSize: 18, height: 48, marginBottom: 8, paddingHorizontal: 14 }}
              placeholder={i18n.t('enter_amount')}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={editAmount}
              onChangeText={v => setEditAmount(v.replace(/[^0-9]/g, ''))}
              maxLength={10}
            />
            <TouchableOpacity
              style={{ backgroundColor: theme.background, borderColor: theme.accent, borderWidth: 2, borderRadius: 12, height: 48, marginBottom: 8, paddingHorizontal: 14, justifyContent: 'center' }}
              onPress={() => setShowEditCategories(true)}
            >
              <Text style={{ color: editCategory ? theme.text : theme.textSecondary, fontSize: 18 }}>
                {editCategory ? i18n.t(editCategory) : i18n.t('category')}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.accent, borderWidth: 2, borderRadius: 12, fontSize: 18, height: 48, marginBottom: 8, paddingHorizontal: 14 }}
              placeholder={i18n.t('description')}
              placeholderTextColor={theme.textSecondary}
              value={editDesc}
              onChangeText={setEditDesc}
              maxLength={40}
            />
            <TouchableOpacity style={[styles.editDateField, { borderColor: theme.accent, backgroundColor: theme.background }]} onPress={() => setShowEditDatePicker(true)}>
              <Ionicons name="calendar" size={20} color={theme.accent} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.text, fontSize: 16 }}>
                {editDate ? editDate.toLocaleDateString('ru-RU') : 'Выберите дату'}
              </Text>
            </TouchableOpacity>
            {showEditDatePicker && (
              <DateTimePicker
                value={editDate || new Date()}
                mode="date"
                onChange={(event, date) => {
                  setShowEditDatePicker(false);
                  if (date) setEditDate(date);
                }}
              />
            )}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
              onPress={async () => {
                if (!editAmount || !editCategory || !selectedTx) return;
                const newTxs = transactions.map(tx => {
                  if (tx.id === selectedTx.id) {
                    return {
                      ...tx,
                      amount: editAmount,
                      category: editCategory,
                      desc: editDesc,
                      date: editDate,
                    };
                  }
                  return tx;
                });
                setTransactions(newTxs);
                await AsyncStorage.setItem('transactions', JSON.stringify(newTxs));
                setShowEditModal(false);
              }}
            >
              <Text style={styles.saveBtnText}>{i18n.t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальное окно выбора категории */}
      <Modal
        visible={showEditCategories}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditCategories(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: theme.card, minHeight: 180, padding: 16, width: '100%', maxWidth: undefined, alignSelf: 'center' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.monthTitle, { color: theme.text }]}>{i18n.t('select_category')}</Text>
              <TouchableOpacity onPress={() => setShowEditCategories(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {selectedTx && (selectedTx.type === 'income' ? categories : expenseCategories).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    { backgroundColor: theme.background },
                    editCategory === cat && { backgroundColor: theme.accent }
                  ]}
                  onPress={() => {
                    setEditCategory(cat);
                    setShowEditCategories(false);
                  }}
                >
                  <Text style={[
                    styles.categoryItemText,
                    { color: editCategory === cat ? '#fff' : theme.text }
                  ]}>
                    {i18n.t(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },
  search: {
    width: width * 0.92,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    width: width * 0.92,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  filterBtnActive: {
    // backgroundColor задаётся динамически
  },
  filterBtnText: {
    fontSize: 15,
    color: '#b0b0b0',
  },
  monthBlock: {
    borderRadius: 18,
    marginBottom: 18,
    padding: 12,
    width: width * 0.92,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  monthSumPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 2,
  },
  monthSumText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  txCard: {
    borderRadius: 18,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 10,
    marginTop: 2,
  },
  txDesc: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  txAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  txCategoryPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginRight: 8,
  },
  txCategoryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  txDate: {
    color: '#b0b0b0',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalActionBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 10,
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
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
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
  categoryItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryItemText: {
    fontSize: 16,
  },
});

export default OperationsScreen; 
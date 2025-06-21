import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import { useTheme, useTransactions, useCurrency, useLanguage } from '../App';
import i18n from '../shared/i18n';

const { width } = Dimensions.get('window');
const BAR_VISIBLE_COUNT = 6;
const BAR_WIDTH = Math.floor(width * 0.92 / BAR_VISIBLE_COUNT);

type Transaction = {
  id: number;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  desc?: string;
  date: string | number | Date;
};

const formatAmount = (num: number | string) => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const StatsScreen = () => {
  const { theme } = useTheme();
  const { transactions } = useTransactions() as { transactions: Transaction[] };
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const now = new Date();
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showYearModal, setShowYearModal] = useState(false);

  // Ref for horizontal ScrollView
  const barScrollRef = useRef<ScrollView>(null);

  // Группировка по месяцам за год
  const monthsData = useMemo(() => {
    const arr = Array(12).fill(0);
    (transactions as Transaction[]).forEach(tx => {
      const d = new Date(tx.date);
      if (d.getFullYear() === year && tx.type === type) {
        arr[d.getMonth()] += Number(tx.amount);
      }
    });
    return arr;
  }, [transactions, year, type]);

  // Сумма за выбранный месяц
  const monthSum = monthsData[month];

  // Группировка по категориям за выбранный месяц с подсчетом количества транзакций
  const categoriesData = useMemo(() => {
    const cats: Record<string, { sum: number; count: number }> = {};
    (transactions as Transaction[]).forEach(tx => {
      const d = new Date(tx.date);
      if (d.getFullYear() === year && d.getMonth() === month && tx.type === type) {
        if (!cats[tx.category]) {
          cats[tx.category] = { sum: 0, count: 0 };
        }
        cats[tx.category].sum += Number(tx.amount);
        cats[tx.category].count += 1;
      }
    });
    // Сортировка по убыванию суммы
    return Object.entries(cats)
      .sort((a, b) => b[1].sum - a[1].sum)
      .map(([category, data]) => ({
        category,
        sum: data.sum,
        count: data.count
      }));
  }, [transactions, year, month, type]);

  // Для bar chart по категориям
  const maxCat = Math.max(...categoriesData.map(c => c.sum), 1);

  // Получаем 12 месяцев
  const monthsToShow = Array.from({ length: 12 }, (_, i) => i);
  const monthsDataFiltered = monthsToShow.map(i => monthsData[i]);
  const maxMonthFiltered = Math.max(...monthsDataFiltered, 1);

  // Автопрокрутка к текущему месяцу при первом рендере
  useEffect(() => {
    if (barScrollRef.current) {
      const scrollTo = Math.max(0, (month - Math.floor(BAR_VISIBLE_COUNT / 2)) * BAR_WIDTH);
      barScrollRef.current.scrollTo({ x: scrollTo, animated: false });
    }
  }, [barScrollRef, month]);

  useEffect(() => { i18n.locale = language; }, [language]);

  const monthNames = i18n.t('months', { locale: language });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      {/* Sticky переключатель */}
      <View style={styles.stickySwitchWrap}>
        <View style={[styles.switchRow, { backgroundColor: theme.card }]}> 
          <TouchableOpacity 
            style={[
              styles.switchBtn, 
              type === 'income' && [styles.switchBtnActive, { backgroundColor: '#1ecb81' }]
            ]} 
            onPress={() => setType('income')}
          >
            <Text style={[styles.switchBtnText, { color: type === 'income' ? '#fff' : theme.textSecondary }]}>
              {i18n.t('income')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.switchBtn, 
              type === 'expense' && [styles.switchBtnActive, { backgroundColor: theme.accent }]
            ]} 
            onPress={() => setType('expense')}
          >
            <Text style={[styles.switchBtnText, { color: type === 'expense' ? '#fff' : theme.textSecondary }]}>
              {i18n.t('expense')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{i18n.t('statistics')}</Text>
          {/* Сумма за месяц */}
          <Text style={[styles.monthSum, { color: theme.text }]}>{formatAmount(monthSum)} {currency}</Text>
          <Text
            style={[styles.yearText, { color: theme.textSecondary, textDecorationLine: 'underline' }]}
            onPress={() => setShowYearModal(true)}
          >
            {year}
          </Text>
          {/* Модальное окно выбора года */}
          <Modal
            visible={showYearModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowYearModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowYearModal(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 18, minWidth: 120, maxHeight: 320 }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18, marginBottom: 10, alignSelf: 'center' }}>Выберите год</Text>
                  <FlatList
                    data={Array.from({ length: 2100 - 2020 + 1 }, (_, i) => 2020 + i)}
                    keyExtractor={item => item.toString()}
                    style={{ maxHeight: 220 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={{ paddingVertical: 8, alignItems: 'center', backgroundColor: item === year ? theme.accent : 'transparent', borderRadius: 8, marginBottom: 2 }}
                        onPress={() => { setYear(item); setShowYearModal(false); }}
                      >
                        <Text style={{ color: item === year ? '#fff' : theme.text, fontSize: 16 }}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    getItemLayout={(_, index) => ({ length: 36, offset: 36 * index, index })}
                    initialScrollIndex={year - 2020}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          {/* Горизонтальный bar chart по месяцам */}
          <View style={[styles.barChartContainer, { backgroundColor: theme.card }]}> 
            <ScrollView 
              ref={barScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.barChartScrollContent, { minWidth: BAR_VISIBLE_COUNT * BAR_WIDTH }]}
            >
              <View style={[styles.barChartRow, { minWidth: BAR_VISIBLE_COUNT * BAR_WIDTH, width: 12 * BAR_WIDTH }]}> 
                {monthsToShow.map((i, idx) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.barChartCol, { width: BAR_WIDTH }]}
                    onPress={() => setMonth(i)}
                  >
                    <Text style={[styles.barValue, { color: theme.textSecondary }]}>
                      {monthsDataFiltered[idx] > 0 ? formatAmount(monthsDataFiltered[idx]) : ''}
                    </Text>
                    <View style={[styles.barChartBar, {
                      height: 120 * (monthsDataFiltered[idx] / maxMonthFiltered),
                      backgroundColor: i === month ? theme.accent : theme.background,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      borderWidth: 2,
                      borderColor: i === month ? theme.accent : theme.textSecondary,
                    }]} />
                    <Text style={[styles.barChartLabel, { 
                      color: i === month ? theme.text : theme.textSecondary,
                      fontWeight: i === month ? 'bold' : 'normal' 
                    }]}>{monthNames[i]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          {/* Категории */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{i18n.t(type)} {i18n.t('by_category')}</Text>
          <View style={styles.categoriesContainer}>
            {categoriesData.length === 0 ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 16 }}>
                {i18n.t('no_data')}
              </Text>
            ) : (
              categoriesData.map(({ category, sum, count }) => (
                <View key={category} style={[styles.catRow, { backgroundColor: theme.card }]}>
                  <View style={styles.catHeader}>
                    <Text style={[styles.catLabel, { color: theme.text }]}>
                      {i18n.t(category)}
                    </Text>
                    <Text style={[styles.catCount, { color: theme.textSecondary }]}>
                      {count} {count === 1 ? i18n.t('transaction_one') : count < 5 ? i18n.t('transaction_few') : i18n.t('transaction_many')}
                    </Text>
                  </View>
                  <View style={styles.catBarWrap}>
                    <View style={[styles.catBar, { 
                      width: `${(sum / maxCat) * 100}%`, 
                      backgroundColor: theme.accent,
                    }]} />
                    <Text style={[styles.catBarValue, { color: theme.text }]}>
                      {formatAmount(sum)} {currency}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickySwitchWrap: {
    zIndex: 10,
    backgroundColor: 'transparent',
    marginBottom: 1,
    paddingTop: 30,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    width: width * 0.92,
    borderRadius: 14,
    backgroundColor: '#f2f2f7',
    marginBottom: 18,
    marginTop: 4,
    alignSelf: 'center',
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  switchBtnActive: {},
  switchBtnText: {
    fontSize: 16,
    color: '#b0b0b0',
  },
  monthSum: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 2,
  },
  yearText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#b0b0b0',
  },
  barChartContainer: {
    width: width * 0.92,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  barChartScrollContent: {
    paddingHorizontal: 0,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    minWidth: Math.max(width * 0.92 - 32, 600),
  },
  barChartCol: {
    alignItems: 'center',
    marginHorizontal: 0,
  },
  barValue: {
    fontSize: 11,
    marginBottom: 4,
    height: 14,
    textAlign: 'center',
  },
  barChartBar: {
    width: 30,
    minHeight: 4,
  },
  barChartLabel: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: width * 0.04,
  },
  categoriesContainer: {
    width: width * 0.92,
    gap: 12,
  },
  catRow: {
    padding: 12,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  catCount: {
    fontSize: 13,
  },
  catBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  catBar: {
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    flex: 1,
  },
  catBarValue: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'right',
  },
});

export default StatsScreen; 
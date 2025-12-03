/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  return (
    purchase.sale_price * purchase.quantity * (1 - purchase.discount / 100)
  );
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const profit = seller.profit;
  let percent = 0;

  if (index === 0) {
    percent = 0.15;
  } else if (index === 1 || index === 2) {
    percent = 0.1;
  } else if (index === total - 1) {
    percent = 0;
  } else {
    percent = 0.05;
  }

  return percent * profit;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.customers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    return { error: 'Некорректные входные данные!', data: data };
    //throw new ('Некорректные входные данные!');
  }
  // @TODO: Проверка наличия опций
  if (
    !options ||
    typeof options !== 'object' ||
    options === null ||
    Array.isArray(options)
  ) {
    return { error: 'Ожидаю объект с функциями!', data: options };
    //throw new Error('Ожидаю объект с функциями!');
  }

  //теперь проверим это точно функции передали
  const { calculateRevenue, calculateBonus } = options;
  //проверю передали не пустоту
  if (!calculateBonus || !calculateRevenue) {
    return {
      error: 'Проблемы с функциями',
      calculateBonus: calculateBonus,
      calculateRevenue: calculateRevenue,
    };
  }
  //проверю функции, что это реально объек функции
  if (
    typeof calculateBonus !== 'function' ||
    typeof calculateRevenue !== 'function'
  ) {
    return {
      error: 'Параметры должны быть функциями',
      calculateBonus: calculateBonus,
      calculateRevenue: calculateRevenue,
    };
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    bonus: 0, //бонусы
    revenue: 0, //выручка
    profit: 0, //прибыль
    sales_count: 0, //количество чеков
    products_sold: [], // массив проданных товаров и сколько
    top_products: [],
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller])
  );
  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product])
  );
  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    //console.log("Чек:", record.receipt_id, "продавец", seller.name);
    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      const cost = item.quantity * product.purchase_price;
      const revenue = calculateSimpleRevenue(item, product);
      const profit = revenue - cost;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });
  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit); //сортировка от большего к меньшему
  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);

    const productsArray = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    seller.top_products = productsArray;
  });
  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}

import { generateId, GAME_STATUS, GAME_TYPES, PAYMENT_STATUS, EQUIPMENT_STATUS } from './constants';

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};
const futureDate = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
};

const PLAYER_NAMES = [
  'Gabriel Lima', 'Matheus Souza', 'Bruno Alves', 'Thiago Pereira', 'Diego Fernandes',
  'Felipe Ribeiro', 'João Martins', 'André Rocha', 'Vinícius Cardoso', 'Leonardo Santos',
  'Renato Gomes', 'Marcos Paulo', 'Henrique Dias', 'Gustavo Neves', 'Rodrigo Machado',
  'Caio Barbosa', 'Patrick Ferreira', 'Eduardo Pinto', 'Igor Monteiro', 'Arthur Lopes',
  'Samuel Costa', 'Victor Hugo', 'Daniel Araújo', 'Paulo Torres', 'Alex Moreira',
  'Fábio Tavares', 'Leandro Braga', 'Marcelo Duarte', 'Ricardo Freitas', 'Sérgio Campos',
];

const FIELD_AREAS = [
  { id: 'area-1', name: 'Alpha Zone', description: 'Dense forest with bunkers — CQB and tactical', capacity: 30, type: 'Forest' },
  { id: 'area-2', name: 'Bravo Village', description: 'Urban scenario with buildings and streets', capacity: 24, type: 'Urban' },
  { id: 'area-3', name: 'Charlie Hills', description: 'Open terrain with elevation changes — sniper friendly', capacity: 40, type: 'Open Field' },
  { id: 'area-4', name: 'Delta Compound', description: 'Indoor/outdoor mix with close-quarters combat', capacity: 16, type: 'CQB' },
];

export function generateSeedData() {
  const now = new Date();

  // Generate field areas
  const fieldAreas = FIELD_AREAS;

  // Generate games (past 6 months + upcoming)
  const games = [];
  for (let i = 0; i < 48; i++) {
    const isPast = i < 40;
    const daysOffset = isPast ? randomBetween(1, 180) : randomBetween(1, 30);
    const date = isPast ? pastDate(daysOffset) : futureDate(daysOffset);
    const type = randomFrom([GAME_TYPES.OPEN, GAME_TYPES.OPEN, GAME_TYPES.CLOSED]); // 2:1 open vs closed
    const area = randomFrom(FIELD_AREAS);
    const capacity = type === GAME_TYPES.OPEN ? area.capacity : randomBetween(10, 20);
    const registered = isPast ? randomBetween(Math.floor(capacity * 0.5), capacity) : randomBetween(0, Math.floor(capacity * 0.7));
    const checkedIn = isPast ? randomBetween(Math.floor(registered * 0.7), registered) : 0;
    const price = type === GAME_TYPES.OPEN ? randomFrom([50, 60, 70, 80]) : randomBetween(1500, 3500);

    let status;
    if (!isPast) {
      status = randomFrom([GAME_STATUS.SCHEDULED, GAME_STATUS.OPEN]);
    } else if (daysOffset < 3) {
      status = GAME_STATUS.IN_PROGRESS;
    } else {
      status = randomFrom([GAME_STATUS.COMPLETED, GAME_STATUS.COMPLETED, GAME_STATUS.COMPLETED, GAME_STATUS.CANCELLED]);
    }

    const players = [];
    const usedNames = new Set();
    for (let j = 0; j < registered; j++) {
      let name;
      do { name = randomFrom(PLAYER_NAMES); } while (usedNames.has(name) && usedNames.size < PLAYER_NAMES.length);
      usedNames.add(name);
      players.push({
        id: generateId(),
        name,
        checkedIn: j < checkedIn,
        phone: `(11) 9${randomBetween(1000, 9999)}-${randomBetween(1000, 9999)}`,
      });
    }

    games.push({
      id: `game-${generateId()}`,
      title: type === GAME_TYPES.OPEN
        ? `${randomFrom(['Domingo', 'Sábado', 'Fim de Semana'])} ${randomFrom(['Batalha', 'Operação', 'Guerra', 'Escaramuça', 'Partida'])}`
        : `${randomFrom(['Corporativo', 'Aniversário', 'Team Building', 'Despedida', 'Privado'])} Event`,
      type,
      date,
      startTime: randomFrom(['08:00', '09:00', '10:00', '14:00']),
      endTime: randomFrom(['12:00', '13:00', '17:00', '18:00']),
      fieldArea: area.id,
      fieldAreaName: area.name,
      capacity,
      pricePerPlayer: type === GAME_TYPES.OPEN ? price : Math.round(price / capacity),
      totalPrice: type === GAME_TYPES.CLOSED ? price : price * registered,
      status,
      players,
      registeredCount: registered,
      checkedInCount: checkedIn,
      notes: type === GAME_TYPES.CLOSED ? randomFrom(['Trazer equipamento próprio', 'Aluguel completo necessário', 'Cliente VIP', '']) : '',
      contactName: type === GAME_TYPES.CLOSED ? randomFrom(PLAYER_NAMES) : '',
      contactPhone: type === GAME_TYPES.CLOSED ? `(11) 9${randomBetween(1000, 9999)}-${randomBetween(1000, 9999)}` : '',
      createdAt: pastDate(daysOffset + randomBetween(3, 14)),
    });
  }

  // Sort games by date
  games.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Generate equipment
  const equipmentItems = [
    { name: 'M4A1 AEG', category: 'Airsoft Guns', purchasePrice: 800, rentalPrice: 40, qty: 15 },
    { name: 'AK-47 AEG', category: 'Airsoft Guns', purchasePrice: 650, rentalPrice: 35, qty: 10 },
    { name: 'G36C AEG', category: 'Airsoft Guns', purchasePrice: 900, rentalPrice: 45, qty: 8 },
    { name: 'Glock 18 GBB', category: 'Airsoft Guns', purchasePrice: 500, rentalPrice: 25, qty: 12 },
    { name: 'Sniper L96', category: 'Airsoft Guns', purchasePrice: 1200, rentalPrice: 60, qty: 4 },
    { name: 'Full Face Mask', category: 'Masks & Goggles', purchasePrice: 120, rentalPrice: 10, qty: 40 },
    { name: 'Tactical Goggles', category: 'Masks & Goggles', purchasePrice: 80, rentalPrice: 8, qty: 30 },
    { name: 'Mesh Lower Mask', category: 'Masks & Goggles', purchasePrice: 45, rentalPrice: 5, qty: 35 },
    { name: 'Plate Carrier Vest', category: 'Tactical Vests', purchasePrice: 250, rentalPrice: 20, qty: 20 },
    { name: 'Chest Rig', category: 'Tactical Vests', purchasePrice: 150, rentalPrice: 15, qty: 15 },
    { name: '0.25g BBs (5000)', category: 'BBs & Ammunition', purchasePrice: 60, rentalPrice: 0, qty: 100 },
    { name: '0.28g BBs (3000)', category: 'BBs & Ammunition', purchasePrice: 50, rentalPrice: 0, qty: 80 },
    { name: 'Green Gas Can', category: 'Gas & CO2', purchasePrice: 40, rentalPrice: 0, qty: 50 },
    { name: 'CO2 Cartridges (5pk)', category: 'Gas & CO2', purchasePrice: 25, rentalPrice: 0, qty: 60 },
    { name: 'Thunder B Grenade', category: 'Grenades', purchasePrice: 180, rentalPrice: 15, qty: 8 },
    { name: 'Smoke Grenade', category: 'Grenades', purchasePrice: 30, rentalPrice: 10, qty: 20 },
    { name: 'Baofeng Radio', category: 'Radios', purchasePrice: 120, rentalPrice: 10, qty: 12 },
    { name: 'LiPo Battery 11.1v', category: 'Batteries & Chargers', purchasePrice: 90, rentalPrice: 0, qty: 25 },
    { name: 'Smart Charger', category: 'Batteries & Chargers', purchasePrice: 150, rentalPrice: 0, qty: 6 },
    { name: 'Knee Pads', category: 'Protective Gear', purchasePrice: 60, rentalPrice: 5, qty: 20 },
    { name: 'Gloves (pair)', category: 'Protective Gear', purchasePrice: 35, rentalPrice: 3, qty: 30 },
    { name: 'Speed Loader', category: 'Accessories', purchasePrice: 15, rentalPrice: 0, qty: 20 },
    { name: 'Red Dot Sight', category: 'Accessories', purchasePrice: 200, rentalPrice: 15, qty: 10 },
  ];

  const equipment = equipmentItems.map((item) => {
    const available = randomBetween(Math.floor(item.qty * 0.5), item.qty);
    const inUse = randomBetween(0, item.qty - available);
    const maintenance = item.qty - available - inUse;

    return {
      id: `eq-${generateId()}`,
      name: item.name,
      category: item.category,
      quantity: item.qty,
      available,
      inUse,
      condition: randomFrom(['New', 'Good', 'Good', 'Good', 'Fair']),
      purchasePrice: item.purchasePrice,
      rentalPrice: item.rentalPrice,
      status: maintenance > 0 ? EQUIPMENT_STATUS.MAINTENANCE : EQUIPMENT_STATUS.AVAILABLE,
      maintenanceCount: maintenance,
      totalRentals: randomBetween(20, 200),
      revenueGenerated: item.rentalPrice * randomBetween(50, 300),
      lastMaintenance: pastDate(randomBetween(5, 60)),
      nextMaintenance: futureDate(randomBetween(5, 60)),
      notes: '',
      createdAt: pastDate(randomBetween(90, 365)),
    };
  });

  // Generate billing records
  const billing = [];
  const completedGames = games.filter((g) => g.status === GAME_STATUS.COMPLETED || g.status === GAME_STATUS.IN_PROGRESS);
  completedGames.forEach((game) => {
    const payStatus = randomFrom([
      PAYMENT_STATUS.PAID, PAYMENT_STATUS.PAID, PAYMENT_STATUS.PAID,
      PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL, PAYMENT_STATUS.OVERDUE,
    ]);
    const totalAmount = game.type === GAME_TYPES.OPEN
      ? game.pricePerPlayer * game.checkedInCount
      : game.totalPrice;
    const paidAmount = payStatus === PAYMENT_STATUS.PAID ? totalAmount
      : payStatus === PAYMENT_STATUS.PARTIAL ? Math.round(totalAmount * randomFrom([0.3, 0.5, 0.7]))
      : 0;

    billing.push({
      id: `bill-${generateId()}`,
      gameId: game.id,
      gameTitle: game.title,
      gameDate: game.date,
      gameType: game.type,
      totalAmount,
      paidAmount,
      status: payStatus,
      paymentMethod: payStatus !== PAYMENT_STATUS.PENDING ? randomFrom(['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito']) : '',
      playerCount: game.checkedInCount,
      notes: '',
      date: game.date,
      createdAt: game.date,
    });
  });

  // Generate expenses
  const expenses = [];
  const expenseTemplates = [
    { category: 'Staff Wages', min: 3000, max: 8000, monthly: true },
    { category: 'Utilities', min: 500, max: 1500, monthly: true },
    { category: 'Rent', min: 4000, max: 4000, monthly: true },
    { category: 'Insurance', min: 800, max: 800, monthly: true },
    { category: 'Equipment Purchase', min: 200, max: 3000, monthly: false },
    { category: 'Equipment Maintenance', min: 100, max: 800, monthly: false },
    { category: 'Supplies (BBs, Gas)', min: 300, max: 1200, monthly: false },
    { category: 'Field Maintenance', min: 200, max: 2000, monthly: false },
    { category: 'Marketing', min: 200, max: 1500, monthly: false },
    { category: 'Administrative', min: 50, max: 500, monthly: false },
  ];

  for (let month = 5; month >= 0; month--) {
    expenseTemplates.forEach((tmpl) => {
      if (tmpl.monthly || Math.random() > 0.4) {
        const count = tmpl.monthly ? 1 : randomBetween(1, 3);
        for (let i = 0; i < count; i++) {
          expenses.push({
            id: `exp-${generateId()}`,
            category: tmpl.category,
            description: `${tmpl.category} — ${tmpl.monthly ? 'Mensal' : randomFrom(['Regular', 'Avulso', 'Programado'])}`,
            amount: randomBetween(tmpl.min, tmpl.max),
            date: pastDate(month * 30 + randomBetween(0, 29)),
            paymentMethod: randomFrom(['Dinheiro', 'PIX', 'Transferência Bancária']),
            createdAt: pastDate(month * 30 + randomBetween(0, 29)),
          });
        }
      }
    });
  }

  // Generate revenue/finance records from billing
  const finances = billing
    .filter((b) => b.paidAmount > 0)
    .map((b) => ({
      id: `fin-${generateId()}`,
      type: 'revenue',
      source: b.gameType === GAME_TYPES.OPEN ? 'Open Games' : 'Closed Games',
      description: `Revenue from ${b.gameTitle}`,
      amount: b.paidAmount,
      date: b.date,
      gameId: b.gameId,
      createdAt: b.date,
    }));

  // Add some equipment rental revenue
  for (let i = 0; i < 30; i++) {
    finances.push({
      id: `fin-rental-${generateId()}`,
      type: 'revenue',
      source: 'Equipment Rental',
      description: `Equipment rental — ${randomFrom(['Conjunto completo', 'Arma + máscara', 'Accessories', 'Aluguel de rádio'])}`,
      amount: randomBetween(30, 200),
      date: pastDate(randomBetween(0, 180)),
      createdAt: pastDate(randomBetween(0, 180)),
    });
  }

  // Settings
  const settings = {
    companyName: 'TacOps Airsoft Field',
    address: 'Estrada do Campo, 1250 — São Paulo, SP',
    phone: '(11) 99876-5432',
    email: 'contact@tacopsfield.com',
    defaultOpenPrice: 60,
    defaultClosedPrice: 2000,
    paymentMethods: ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Bank Transfer'],
    onboardingComplete: true,
    currency: 'BRL',
  };

  return {
    games,
    equipment,
    billing,
    expenses,
    finances,
    fieldAreas,
    settings,
    players: [],
  };
}

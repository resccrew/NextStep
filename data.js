/* global window */
// Mock job and user data

const SKILL_GROUPS = [
  {
    name: 'Разработка',
    skills: ['React', 'Vue', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java', 'PHP', 'SQL', 'GraphQL', 'Next.js']
  },
  {
    name: 'Дизайн',
    skills: ['Figma', 'UI/UX', 'Прототипирование', 'Иллюстрация', 'Motion', 'Adobe XD']
  },
  {
    name: 'Маркетинг',
    skills: ['SEO', 'Контент', 'Email-рассылки', 'Аналитика', 'Performance', 'Бренд']
  },
  {
    name: 'Аналитика',
    skills: ['SQL', 'Power BI', 'Tableau', 'Excel', 'Python', 'A/B тесты']
  },
  {
    name: 'Менеджмент',
    skills: ['Agile', 'Scrum', 'Product', 'Управление командой', 'OKR']
  }
];

const JOBS = [
  {
    id: 1,
    title: 'Frontend-разработчик (React)',
    company: 'Lunary',
    logo: 'L',
    location: 'Москва · удалённо',
    salary: '220 000 – 280 000 ₽',
    type: 'Полная',
    posted: '2 часа назад',
    match: 94,
    tags: ['React', 'TypeScript', 'Next.js'],
    why: 'Совпадают 5 из 6 ваших навыков · опыт совпадает',
    featured: true,
    description: 'Создаём финансовый сервис нового поколения. Ищем фронт-инженера, который любит чистый код и тонкую анимацию.'
  },
  {
    id: 2,
    title: 'Product-дизайнер',
    company: 'Forma',
    logo: 'F',
    location: 'Санкт-Петербург · гибрид',
    salary: '180 000 – 240 000 ₽',
    type: 'Полная',
    posted: '5 часов назад',
    match: 88,
    tags: ['Figma', 'UI/UX', 'Прототипирование'],
    why: 'Семантически близко к вашему опыту',
    description: 'Работаем над B2B-инструментами для логистики. Большая свобода в продуктовых решениях.'
  },
  {
    id: 3,
    title: 'Fullstack-инженер',
    company: 'Northpath',
    logo: 'N',
    location: 'Удалённо · РФ',
    salary: '250 000 – 320 000 ₽',
    type: 'Полная',
    posted: 'Вчера',
    match: 86,
    tags: ['React', 'Node.js', 'PostgreSQL'],
    why: 'Подходит по опыту 3+ года',
    description: 'Образовательная платформа для школ. Маленькая команда, прямой контакт с пользователями.'
  },
  {
    id: 4,
    title: 'Senior React-инженер',
    company: 'Atlas Health',
    logo: 'A',
    location: 'Тбилиси · релокация',
    salary: '$4 500 – $5 500',
    type: 'Полная',
    posted: '1 день назад',
    match: 82,
    tags: ['React', 'TypeScript', 'Redux'],
    why: 'Совпадает по стэку и сениорности',
    description: 'Медтех — приложение для врачей. ESOP, релокационный пакет, английский B2+.'
  },
  {
    id: 5,
    title: 'Data-аналитик',
    company: 'Briefly',
    logo: 'B',
    location: 'Удалённо · РФ/СНГ',
    salary: '160 000 – 210 000 ₽',
    type: 'Полная',
    posted: '2 дня назад',
    match: 71,
    tags: ['SQL', 'Python', 'A/B тесты'],
    why: 'Частичное совпадение по аналитическим навыкам',
    description: 'Маркетинговое агентство ищет аналитика, который может перевести данные в инсайты.'
  },
  {
    id: 6,
    title: 'Frontend-разработчик (Vue)',
    company: 'Pebble',
    logo: 'P',
    location: 'Москва · офис',
    salary: '180 000 – 230 000 ₽',
    type: 'Полная',
    posted: '3 дня назад',
    match: 78,
    tags: ['Vue', 'JavaScript', 'CSS'],
    why: 'Близкая технология (Vue ↔ React)',
    description: 'Внутренние инструменты для контент-команды. Стабильный продукт, спокойный темп.'
  },
  {
    id: 7,
    title: 'Product Manager (B2B)',
    company: 'Cargo Loop',
    logo: 'C',
    location: 'Удалённо',
    salary: '230 000 – 290 000 ₽',
    type: 'Полная',
    posted: '4 дня назад',
    match: 65,
    tags: ['Product', 'B2B', 'Agile'],
    why: 'Совпадение по управленческим навыкам',
    description: 'Платформа для грузоперевозок. Нужен опыт ведения продукта от идеи до релиза.'
  },
  {
    id: 8,
    title: 'Junior Frontend-разработчик',
    company: 'Veridian',
    logo: 'V',
    location: 'Казань · гибрид',
    salary: '90 000 – 130 000 ₽',
    type: 'Полная',
    posted: '5 дней назад',
    match: 60,
    tags: ['JavaScript', 'HTML', 'CSS'],
    why: 'Подходит как ступень карьеры',
    description: 'Команда из 6 человек, наставник на испытательный срок, обучение оплачивается.'
  }
];

Object.assign(window, { SKILL_GROUPS, JOBS });

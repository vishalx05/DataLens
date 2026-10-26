export const sampleDatasets = [
  {
    id: 'sales',
    name: 'Sales & Revenue Performance',
    fileName: 'global-sales-data.csv',
    description: 'Quarterly retail technology sales across regions, costs, and profit margins.',
    rows: [
      { Date: '2026-01-03', Product: 'Laptop Pro', Region: 'North', Sales: 52000, Cost: 39000, Profit: 13000, Units: 26, Discount: 5 },
      { Date: '2026-01-08', Product: 'Smartphone Ultra', Region: 'West', Sales: 38000, Cost: 24000, Profit: 14000, Units: 42, Discount: 8 },
      { Date: '2026-01-13', Product: 'Tablet Air', Region: 'South', Sales: 18000, Cost: 12000, Profit: 6000, Units: 30, Discount: 10 },
      { Date: '2026-02-02', Product: 'Laptop Pro', Region: 'East', Sales: 64000, Cost: 48000, Profit: 16000, Units: 32, Discount: 0 },
      { Date: '2026-02-11', Product: 'Smartphone Ultra', Region: 'North', Sales: 31000, Cost: 19000, Profit: 12000, Units: 35, Discount: 5 },
      { Date: '2026-02-19', Product: '4K Gaming Monitor', Region: 'West', Sales: 28000, Cost: 17500, Profit: 10500, Units: 28, Discount: 12 },
      { Date: '2026-03-04', Product: 'Tablet Air', Region: 'East', Sales: 24000, Cost: 15500, Profit: 8500, Units: 36, Discount: 5 },
      { Date: '2026-03-12', Product: 'Laptop Pro', Region: 'South', Sales: 71000, Cost: 53000, Profit: 18000, Units: 38, Discount: 4 },
      { Date: '2026-03-23', Product: 'Wireless Headphones', Region: 'West', Sales: 15000, Cost: 8500, Profit: 6500, Units: 60, Discount: 15 },
      { Date: '2026-04-01', Product: '4K Gaming Monitor', Region: 'North', Sales: 33000, Cost: 21000, Profit: 12000, Units: 33, Discount: 8 },
      { Date: '2026-04-14', Product: 'Tablet Air', Region: 'South', Sales: 21000, Cost: 13000, Profit: 8000, Units: 29, Discount: 6 },
      { Date: '2026-04-26', Product: 'Laptop Pro', Region: 'West', Sales: 59000, Cost: 43000, Profit: 16000, Units: 31, Discount: 5 },
      { Date: '2026-05-02', Product: 'Smartwatch Elite', Region: 'East', Sales: 19500, Cost: 11000, Profit: 8500, Units: 45, Discount: 10 },
      { Date: '2026-05-18', Product: 'Wireless Headphones', Region: 'North', Sales: 17200, Cost: 9500, Profit: 7700, Units: 68, Discount: 12 },
      { Date: '2026-06-05', Product: 'Smartphone Ultra', Region: 'East', Sales: 44000, Cost: 28000, Profit: 16000, Units: 49, Discount: 7 },
      { Date: '2026-06-22', Product: '4K Gaming Monitor', Region: 'South', Sales: 26500, Cost: 16500, Profit: 10000, Units: 26, Discount: 10 }
    ]
  },
  {
    id: 'hr',
    name: 'Employee & HR Analytics',
    fileName: 'employee-compensation.csv',
    description: 'Workforce statistics tracking compensation, experience, and performance scores.',
    rows: [
      { EmployeeID: 'EMP-101', Department: 'Engineering', Role: 'Senior Developer', Salary: 128000, ExperienceYears: 8, PerformanceScore: 92, RemoteStatus: 'Remote', JoinDate: '2021-03-15' },
      { EmployeeID: 'EMP-102', Department: 'Marketing', Role: 'Growth Lead', Salary: 95000, ExperienceYears: 5, PerformanceScore: 88, RemoteStatus: 'Hybrid', JoinDate: '2022-06-01' },
      { EmployeeID: 'EMP-103', Department: 'Sales', Role: 'Account Executive', Salary: 88000, ExperienceYears: 4, PerformanceScore: 84, RemoteStatus: 'Onsite', JoinDate: '2023-01-10' },
      { EmployeeID: 'EMP-104', Department: 'Engineering', Role: 'DevOps Specialist', Salary: 135000, ExperienceYears: 9, PerformanceScore: 95, RemoteStatus: 'Remote', JoinDate: '2020-09-20' },
      { EmployeeID: 'EMP-105', Department: 'Product', Role: 'Product Manager', Salary: 118000, ExperienceYears: 7, PerformanceScore: 90, RemoteStatus: 'Hybrid', JoinDate: '2021-11-04' },
      { EmployeeID: 'EMP-106', Department: 'Design', Role: 'UI/UX Designer', Salary: 89000, ExperienceYears: 4, PerformanceScore: 87, RemoteStatus: 'Remote', JoinDate: '2023-04-12' },
      { EmployeeID: 'EMP-107', Department: 'Sales', Role: 'Sales Director', Salary: 142000, ExperienceYears: 11, PerformanceScore: 96, RemoteStatus: 'Onsite', JoinDate: '2019-02-18' },
      { EmployeeID: 'EMP-108', Department: 'HR', Role: 'People Ops Manager', Salary: 82000, ExperienceYears: 5, PerformanceScore: 86, RemoteStatus: 'Hybrid', JoinDate: '2022-08-15' },
      { EmployeeID: 'EMP-109', Department: 'Engineering', Role: 'Junior Engineer', Salary: 76000, ExperienceYears: 2, PerformanceScore: 80, RemoteStatus: 'Remote', JoinDate: '2024-02-01' },
      { EmployeeID: 'EMP-110', Department: 'Marketing', Role: 'Content Strategist', Salary: 72000, ExperienceYears: 3, PerformanceScore: 83, RemoteStatus: 'Remote', JoinDate: '2023-08-10' },
      { EmployeeID: 'EMP-111', Department: 'Product', Role: 'Associate PM', Salary: 84000, ExperienceYears: 3, PerformanceScore: 82, RemoteStatus: 'Hybrid', JoinDate: '2023-09-01' },
      { EmployeeID: 'EMP-112', Department: 'Engineering', Role: 'Staff Architect', Salary: 165000, ExperienceYears: 14, PerformanceScore: 98, RemoteStatus: 'Remote', JoinDate: '2018-05-14' }
    ]
  },
  {
    id: 'saas',
    name: 'SaaS Subscription Metrics',
    fileName: 'saas-mrr-churn.csv',
    description: 'Recurring subscription revenue, user engagement, and customer churn indicators.',
    rows: [
      { Account: 'Acme Corp', PlanTier: 'Enterprise', MRR: 4800, ActiveUsers: 145, NPS: 68, SupportTickets: 3, ChurnRisk: 8, SignupDate: '2024-02-14' },
      { Account: 'Starlight Media', PlanTier: 'Pro', MRR: 1200, ActiveUsers: 34, NPS: 52, SupportTickets: 7, ChurnRisk: 24, SignupDate: '2024-05-20' },
      { Account: 'Nexora Health', PlanTier: 'Enterprise', MRR: 6200, ActiveUsers: 210, NPS: 74, SupportTickets: 2, ChurnRisk: 5, SignupDate: '2023-11-08' },
      { Account: 'Finova Labs', PlanTier: 'Growth', MRR: 2400, ActiveUsers: 72, NPS: 60, SupportTickets: 4, ChurnRisk: 14, SignupDate: '2024-07-01' },
      { Account: 'BrightPath Inc', PlanTier: 'Pro', MRR: 1400, ActiveUsers: 40, NPS: 45, SupportTickets: 9, ChurnRisk: 38, SignupDate: '2024-08-11' },
      { Account: 'Vertex Dynamics', PlanTier: 'Enterprise', MRR: 5400, ActiveUsers: 180, NPS: 70, SupportTickets: 1, ChurnRisk: 6, SignupDate: '2024-01-19' },
      { Account: 'Apex Retailers', PlanTier: 'Growth', MRR: 2100, ActiveUsers: 58, NPS: 58, SupportTickets: 5, ChurnRisk: 18, SignupDate: '2024-09-12' },
      { Account: 'Quantum Cloud', PlanTier: 'Enterprise', MRR: 7100, ActiveUsers: 260, NPS: 78, SupportTickets: 2, ChurnRisk: 4, SignupDate: '2023-08-25' },
      { Account: 'Echo Solutions', PlanTier: 'Starter', MRR: 450, ActiveUsers: 12, NPS: 40, SupportTickets: 6, ChurnRisk: 42, SignupDate: '2025-01-05' },
      { Account: 'BlueSky Logistics', PlanTier: 'Growth', MRR: 2600, ActiveUsers: 84, NPS: 64, SupportTickets: 3, ChurnRisk: 12, SignupDate: '2024-04-18' }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store Orders',
    fileName: 'ecommerce-orders.csv',
    description: 'Online store customer orders across categories, item counts, ratings, and payment channels.',
    rows: [
      { OrderID: 'ORD-9001', Category: 'Consumer Electronics', CustomerSegment: 'VIP', OrderTotal: 840, ItemsCount: 3, Rating: 5, PaymentMethod: 'Credit Card', OrderDate: '2026-03-01' },
      { OrderID: 'ORD-9002', Category: 'Home & Kitchen', CustomerSegment: 'Regular', OrderTotal: 185, ItemsCount: 2, Rating: 4, PaymentMethod: 'UPI', OrderDate: '2026-03-02' },
      { OrderID: 'ORD-9003', Category: 'Fashion Apparel', CustomerSegment: 'Regular', OrderTotal: 290, ItemsCount: 4, Rating: 4, PaymentMethod: 'Credit Card', OrderDate: '2026-03-03' },
      { OrderID: 'ORD-9004', Category: 'Sports & Fitness', CustomerSegment: 'New', OrderTotal: 420, ItemsCount: 2, Rating: 5, PaymentMethod: 'NetBanking', OrderDate: '2026-03-05' },
      { OrderID: 'ORD-9005', Category: 'Consumer Electronics', CustomerSegment: 'Corporate', OrderTotal: 1650, ItemsCount: 6, Rating: 5, PaymentMethod: 'Credit Card', OrderDate: '2026-03-06' },
      { OrderID: 'ORD-9006', Category: 'Home & Kitchen', CustomerSegment: 'New', OrderTotal: 95, ItemsCount: 1, Rating: 3, PaymentMethod: 'UPI', OrderDate: '2026-03-08' },
      { OrderID: 'ORD-9007', Category: 'Fashion Apparel', CustomerSegment: 'VIP', OrderTotal: 620, ItemsCount: 5, Rating: 5, PaymentMethod: 'Credit Card', OrderDate: '2026-03-09' },
      { OrderID: 'ORD-9008', Category: 'Books & Media', CustomerSegment: 'Regular', OrderTotal: 110, ItemsCount: 3, Rating: 4, PaymentMethod: 'UPI', OrderDate: '2026-03-10' },
      { OrderID: 'ORD-9009', Category: 'Sports & Fitness', CustomerSegment: 'VIP', OrderTotal: 780, ItemsCount: 3, Rating: 5, PaymentMethod: 'Credit Card', OrderDate: '2026-03-11' },
      { OrderID: 'ORD-9010', Category: 'Books & Media', CustomerSegment: 'New', OrderTotal: 65, ItemsCount: 1, Rating: 4, PaymentMethod: 'UPI', OrderDate: '2026-03-12' }
    ]
  }
];

export const demoRows = sampleDatasets[0].rows;

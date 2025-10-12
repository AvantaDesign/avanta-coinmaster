-- Seed data for testing Avanta Finance
-- Run this after schema.sql to populate with sample data

-- Sample transactions for October 2025
INSERT INTO transactions (date, description, amount, type, category, account, is_deductible, economic_activity) VALUES
  ('2025-10-01', 'Venta de servicio diseño web', 15000.00, 'ingreso', 'avanta', 'BBVA', 0, '512191'),
  ('2025-10-03', 'Compra equipo fotografía', 8500.00, 'gasto', 'avanta', 'BBVA', 1, '512191'),
  ('2025-10-05', 'Pago renta local', 5000.00, 'gasto', 'avanta', 'BBVA', 1, '512191'),
  ('2025-10-07', 'Ingreso por videoclip', 25000.00, 'ingreso', 'avanta', 'BBVA', 0, '512191'),
  ('2025-10-08', 'Compra software Adobe', 1200.00, 'gasto', 'avanta', 'Tarjeta Crédito', 1, '512191'),
  ('2025-10-10', 'Supermercado', 2500.00, 'gasto', 'personal', 'Banco Azteca', 0, NULL),
  ('2025-10-12', 'Ingreso venta artesanías', 3500.00, 'ingreso', 'avanta', 'BBVA', 0, '463111'),
  ('2025-10-15', 'Gasolina', 800.00, 'gasto', 'personal', 'BBVA', 0, NULL),
  ('2025-10-18', 'Servicio publicidad cliente', 12000.00, 'ingreso', 'avanta', 'BBVA', 0, '541890'),
  ('2025-10-20', 'Compra materiales producción', 4500.00, 'gasto', 'avanta', 'BBVA', 1, '512191'),
  ('2025-10-22', 'Internet y hosting', 850.00, 'gasto', 'avanta', 'Tarjeta Crédito', 1, '512191'),
  ('2025-10-25', 'Ingreso producción video', 18000.00, 'ingreso', 'avanta', 'BBVA', 0, '512110'),
  ('2025-10-28', 'Restaurante', 1200.00, 'gasto', 'personal', 'BBVA', 0, NULL),
  ('2025-10-30', 'Servicios profesionales', 9500.00, 'ingreso', 'avanta', 'BBVA', 0, '561499');

-- Update account balances based on transactions
UPDATE accounts SET balance = 45000.00 WHERE name = 'BBVA Cuenta';
UPDATE accounts SET balance = 8000.00 WHERE name = 'Banco Azteca';
UPDATE accounts SET balance = -2050.00 WHERE name = 'Tarjeta Crédito';

-- Sample invoices
INSERT INTO invoices (uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, status) VALUES
  ('12345678-1234-1234-1234-123456789012', 'REGM000905T24', 'XAXX010101000', '2025-10-01', 12931.03, 2068.97, 15000.00, 'active'),
  ('23456789-2345-2345-2345-234567890123', 'XAXX010101000', 'REGM000905T24', '2025-10-03', 7327.59, 1172.41, 8500.00, 'active'),
  ('34567890-3456-3456-3456-345678901234', 'REGM000905T24', 'XAXX010101000', '2025-10-07', 21551.72, 3448.28, 25000.00, 'active'),
  ('45678901-4567-4567-4567-456789012345', 'REGM000905T24', 'XAXX010101000', '2025-10-18', 10344.83, 1655.17, 12000.00, 'active');

-- Sample fiscal payment tracking
INSERT INTO fiscal_payments (year, month, isr, iva, due_date, status) VALUES
  (2025, 9, 4500.00, 3200.00, '2025-10-17', 'paid'),
  (2025, 10, 0, 0, '2025-11-17', 'pending');

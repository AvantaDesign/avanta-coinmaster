// Financial Tasks API - Manage user financial task tracking
// Phase 5: In-App Financial Activities and Workflows

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Default financial tasks by frequency
const DEFAULT_TASKS = {
  daily: [
    { task_key: 'check_cash_flow', title: 'Revisar Flujo de Efectivo', description: 'Verificar el saldo de cuentas y el flujo de efectivo del día', category: 'cash_flow' },
    { task_key: 'review_pending_invoices', title: 'Revisar Facturas Pendientes', description: 'Revisar facturas pendientes de cobro y pago', category: 'invoices' },
    { task_key: 'process_payments', title: 'Procesar Pagos', description: 'Procesar pagos pendientes y registrar transacciones', category: 'payments' }
  ],
  weekly: [
    { task_key: 'reconcile_bank', title: 'Conciliar Cuentas Bancarias', description: 'Reconciliar estados de cuenta bancarios', category: 'reconciliation' },
    { task_key: 'review_budget', title: 'Revisar Desempeño del Presupuesto', description: 'Comparar gastos reales vs presupuesto', category: 'budget' },
    { task_key: 'update_projects', title: 'Actualizar Estado de Proyectos', description: 'Actualizar el estado y facturación de proyectos activos', category: 'projects' },
    { task_key: 'follow_up_overdue', title: 'Seguimiento de Facturas Vencidas', description: 'Hacer seguimiento de facturas vencidas por cobrar', category: 'invoices' }
  ],
  monthly: [
    { task_key: 'generate_reports', title: 'Generar Reportes Financieros', description: 'Generar estados financieros mensuales', category: 'reports' },
    { task_key: 'review_tax_obligations', title: 'Revisar Obligaciones Fiscales', description: 'Revisar y calcular impuestos mensuales', category: 'tax' },
    { task_key: 'analyze_profitability', title: 'Analizar Rentabilidad', description: 'Analizar rentabilidad por categoría y proyecto', category: 'analysis' },
    { task_key: 'review_recurring', title: 'Revisar Pagos Recurrentes', description: 'Revisar y actualizar pagos recurrentes', category: 'recurring' }
  ],
  quarterly: [
    { task_key: 'quarterly_tax_filing', title: 'Declaración Fiscal Trimestral', description: 'Preparar y presentar declaración trimestral', category: 'tax' },
    { task_key: 'financial_review', title: 'Revisión Financiera Integral', description: 'Revisión completa de la situación financiera', category: 'review' },
    { task_key: 'budget_planning', title: 'Planificación Presupuestaria', description: 'Revisar y ajustar presupuestos para el próximo trimestre', category: 'budget' }
  ],
  annual: [
    { task_key: 'year_end_closing', title: 'Cierre Anual', description: 'Realizar el cierre contable del año fiscal', category: 'closing' },
    { task_key: 'annual_tax_prep', title: 'Preparación Fiscal Anual', description: 'Preparar documentación para declaración anual', category: 'tax' },
    { task_key: 'strategic_planning', title: 'Planificación Estratégica', description: 'Planificación financiera y estratégica para el próximo año', category: 'planning' }
  ]
};

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const frequency = url.searchParams.get('frequency');
    const completed = url.searchParams.get('completed');
    const dueDate = url.searchParams.get('due_date');
    const userId = 1; // In production, get from auth token

    // Build query
    let query = 'SELECT * FROM financial_tasks WHERE user_id = ?';
    const params = [userId];

    if (frequency) {
      query += ' AND frequency = ?';
      params.push(frequency);
    }

    if (completed !== null && completed !== undefined) {
      query += ' AND is_completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }

    if (dueDate) {
      query += ' AND due_date = ?';
      params.push(dueDate);
    }

    query += ' ORDER BY due_date DESC, frequency, created_at DESC';

    const { results: tasks } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    // Get completion stats
    const stats = await env.DB.prepare(`
      SELECT 
        frequency,
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
      FROM financial_tasks 
      WHERE user_id = ?
      GROUP BY frequency
    `).bind(userId).all();

    return new Response(JSON.stringify({
      tasks,
      stats: stats.results || [],
      defaultTasks: DEFAULT_TASKS
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch tasks',
      code: 'FETCH_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const userId = 1; // In production, get from auth token

    // Validate required fields
    if (!data.task_key || !data.frequency || !data.title) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: task_key, frequency, title',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
    if (!validFrequencies.includes(data.frequency)) {
      return new Response(JSON.stringify({ 
        error: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if task already exists for this period
    if (data.due_date) {
      const existing = await env.DB.prepare(
        'SELECT id FROM financial_tasks WHERE user_id = ? AND task_key = ? AND due_date = ?'
      ).bind(userId, data.task_key, data.due_date).first();

      if (existing) {
        return new Response(JSON.stringify({ 
          error: 'Task already exists for this period',
          code: 'DUPLICATE_ERROR'
        }), {
          status: 409,
          headers: corsHeaders
        });
      }
    }

    // Insert task
    const result = await env.DB.prepare(`
      INSERT INTO financial_tasks (
        user_id, task_key, frequency, title, description, 
        category, due_date, is_completed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      data.task_key,
      data.frequency,
      data.title,
      data.description || null,
      data.category || null,
      data.due_date || null,
      data.is_completed || 0
    ).run();

    // Fetch the created task
    const task = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify(task), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create task',
      code: 'CREATE_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');
    const userId = 1; // In production, get from auth token

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Task ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if task exists
    const existing = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Task not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Handle different actions
    if (action === 'toggle') {
      const newCompleted = existing.is_completed ? 0 : 1;
      const completedAt = newCompleted ? 'CURRENT_TIMESTAMP' : 'NULL';
      
      await env.DB.prepare(`
        UPDATE financial_tasks 
        SET is_completed = ?, 
            completed_at = ${completedAt},
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `).bind(newCompleted, id, userId).run();
    } else {
      // Regular update
      const data = await request.json();
      const updates = [];
      const params = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        params.push(data.title);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description);
      }
      if (data.category !== undefined) {
        updates.push('category = ?');
        params.push(data.category);
      }
      if (data.due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(data.due_date);
      }
      if (data.is_completed !== undefined) {
        updates.push('is_completed = ?');
        params.push(data.is_completed ? 1 : 0);
        if (data.is_completed) {
          updates.push('completed_at = CURRENT_TIMESTAMP');
        }
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No valid fields to update',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id, userId);

      const query = `
        UPDATE financial_tasks 
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

      await env.DB.prepare(query).bind(...params).run();
    }

    // Fetch updated task
    const updated = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update task',
      code: 'UPDATE_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = 1; // In production, get from auth token

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Task ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if task exists
    const existing = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Task not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Delete task
    await env.DB.prepare(
      'DELETE FROM financial_tasks WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Task deleted successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete task',
      code: 'DELETE_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

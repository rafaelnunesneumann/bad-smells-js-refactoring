const ADMIN_ROLE = 'ADMIN';
const USER_ROLE = 'USER';
const PRIORITY_VALUE_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

class CsvFormatter {
  formatHeader() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  formatRow(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  formatFooter(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlFormatter {
  formatHeader(user) {
    return [
      '<html><body>\n',
      '<h1>Relatório</h1>\n',
      `<h2>Usuário: ${user.name}</h2>\n`,
      '<table>\n',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
    ].join('');
  }

  formatRow(item, user) {
    // Somente admins veem o destaque de itens prioritários
    const isHighlighted = user.role === ADMIN_ROLE && item.priority;
    const style = isHighlighted ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  formatFooter(total) {
    return `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`;
  }
}

const FORMATTERS = new Map([
  ['CSV', new CsvFormatter()],
  ['HTML', new HtmlFormatter()],
]);

const VISIBILITY_RULES = new Map([
  [ADMIN_ROLE, () => true],
  [USER_ROLE, (item) => item.value <= USER_MAX_VISIBLE_VALUE],
]);

function markPriorityItems(user, items) {
  if (user.role !== ADMIN_ROLE) {
    return;
  }

  for (const item of items) {
    if (item.value > PRIORITY_VALUE_THRESHOLD) {
      item.priority = true;
    }
  }
}

function getVisibleItems(user, items) {
  const canView = VISIBILITY_RULES.get(user.role);
  return canView ? items.filter(canView) : [];
}

function sumValues(items) {
  return items.reduce((total, item) => total + item.value, 0);
}

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    markPriorityItems(user, items);

    const formatter = FORMATTERS.get(reportType);
    if (!formatter) {
      return '';
    }

    const visibleItems = getVisibleItems(user, items);
    const rows = visibleItems.map((item) => formatter.formatRow(item, user)).join('');
    const report = formatter.formatHeader(user) + rows + formatter.formatFooter(sumValues(visibleItems));

    return report.trim();
  }
}

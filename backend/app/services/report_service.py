import io
from datetime import date
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models import Expense, User
from app.services.budget_service import BudgetService


class ReportService:

    @staticmethod
    def _currency_symbol(currency_code: str) -> str:
        symbols = {
            'MXN': '$',
            'USD': '$',
            'EUR': 'EUR ',
            'GBP': 'GBP ',
            'CAD': 'C$',
            'ARS': '$',
            'CLP': '$',
            'COP': '$',
            'PEN': 'S/',
            'BRL': 'R$'
        }
        return symbols.get(currency_code, '$')

    @staticmethod
    def _format_currency(amount, currency_code: str) -> str:
        if isinstance(amount, Decimal):
            amount = float(amount)
        symbol = ReportService._currency_symbol(currency_code)
        return f"{symbol}{amount:,.2f}"

    @staticmethod
    def _format_date(value: date) -> str:
        return value.strftime('%d/%m/%Y')

    @staticmethod
    def generate_pdf_report(user_id, report_type, start_date, end_date):
        """Generate a detailed PDF report"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#111827'),
            spaceAfter=6
        )

        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=10
        )

        meta_style = ParagraphStyle(
            'ReportMeta',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#4B5563'),
            spaceAfter=4
        )

        elements = []

        user = User.query.get(user_id)
        profile = user.profile if user else None
        currency_code = profile.currency_code if profile else 'USD'
        currency_symbol = ReportService._currency_symbol(currency_code)
        user_name = profile.full_name if profile else (user.email if user else 'Usuario')

        report_title = 'Reporte de gastos'
        if report_type == 'weekly':
            report_title = 'Reporte semanal de gastos'
        elif report_type == 'monthly':
            report_title = 'Reporte mensual de gastos'

        elements.append(Paragraph(report_title, title_style))
        elements.append(Paragraph(
            f"Periodo: {ReportService._format_date(start_date)} - {ReportService._format_date(end_date)}",
            meta_style
        ))
        elements.append(Paragraph(f"Usuario: {user_name}", meta_style))
        elements.append(Paragraph(f"Moneda: {currency_code} ({currency_symbol})", meta_style))
        elements.append(Spacer(1, 16))

        total_spent = BudgetService.get_period_expenses(user_id, start_date, end_date)
        by_category = BudgetService.get_expenses_by_category(user_id, start_date, end_date)

        expenses = Expense.query.filter(
            Expense.user_id == user_id,
            Expense.is_deleted == False,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).order_by(Expense.expense_date.asc(), Expense.created_at.asc()).all()

        total_spent_value = float(total_spent)
        expense_count = len(expenses)
        period_days = (end_date - start_date).days + 1
        average_daily = total_spent_value / period_days if period_days > 0 else 0
        average_expense = total_spent_value / expense_count if expense_count > 0 else 0
        categories_used = len([c for c in by_category if c.get('total', 0) > 0])

        elements.append(Paragraph('Resumen general', subtitle_style))

        summary_data = [
            ['Metrica', 'Valor'],
            ['Total gastado', ReportService._format_currency(total_spent_value, currency_code)],
            ['Numero de gastos', str(expense_count)],
            ['Promedio diario', ReportService._format_currency(average_daily, currency_code)],
            ['Promedio por gasto', ReportService._format_currency(average_expense, currency_code)],
            ['Categorias usadas', str(categories_used)]
        ]

        summary_table = Table(summary_data, colWidths=[3.2 * inch, 2.2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor('#F9FAFB')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))

        elements.append(summary_table)
        elements.append(Spacer(1, 18))

        elements.append(Paragraph('Gastos por categoria', subtitle_style))

        if by_category:
            total_by_category = sum([c.get('total', 0) for c in by_category])
            category_data = [['Categoria', 'Total', '% del total']]

            for cat in sorted(by_category, key=lambda item: item.get('total', 0), reverse=True):
                total_value = cat.get('total', 0)
                if total_value <= 0:
                    continue
                percentage = (total_value / total_by_category * 100) if total_by_category > 0 else 0
                category_data.append([
                    cat.get('name', 'Sin categoria'),
                    ReportService._format_currency(total_value, currency_code),
                    f"{percentage:.1f}%"
                ])

            category_table = Table(category_data, colWidths=[3.0 * inch, 1.6 * inch, 1.2 * inch], repeatRows=1)
            category_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111827')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
            ]))
            elements.append(category_table)
        else:
            elements.append(Paragraph('No hay gastos en este periodo.', styles['Normal']))

        elements.append(Spacer(1, 18))

        daily_totals = {}
        for exp in expenses:
            daily_totals[exp.expense_date] = daily_totals.get(exp.expense_date, 0) + float(exp.amount)

        if daily_totals:
            elements.append(Paragraph('Resumen diario', subtitle_style))
            daily_data = [['Fecha', 'Total del dia']]
            for day in sorted(daily_totals.keys()):
                daily_data.append([
                    ReportService._format_date(day),
                    ReportService._format_currency(daily_totals[day], currency_code)
                ])

            daily_table = Table(daily_data, colWidths=[2.0 * inch, 2.3 * inch], repeatRows=1)
            daily_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4B5563')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT')
            ]))

            elements.append(daily_table)
            elements.append(Spacer(1, 18))

        if expenses:
            elements.append(Paragraph('Detalle de gastos', subtitle_style))
            expense_data = [['Fecha', 'Hora', 'Categoria', 'Descripcion', 'Monto']]
            max_rows = 200

            for exp in expenses[:max_rows]:
                description = exp.description or ''
                if len(description) > 60:
                    description = f"{description[:57]}..."
                expense_data.append([
                    ReportService._format_date(exp.expense_date),
                    exp.expense_time.strftime('%H:%M') if exp.expense_time else '',
                    exp.category.name if exp.category else 'Sin categoria',
                    description,
                    ReportService._format_currency(exp.amount, currency_code)
                ])

            expense_table = Table(
                expense_data,
                colWidths=[1.1 * inch, 0.7 * inch, 1.6 * inch, 2.6 * inch, 1.0 * inch],
                repeatRows=1
            )
            expense_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1D4ED8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
                ('ALIGN', (4, 1), (4, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
            ]))

            elements.append(expense_table)

            if len(expenses) > max_rows:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(
                    f"Se muestran los primeros {max_rows} gastos. Exporta el CSV para ver el detalle completo.",
                    meta_style
                ))
        else:
            elements.append(Paragraph('No hay gastos en este periodo.', styles['Normal']))

        elements.append(Spacer(1, 24))
        elements.append(Paragraph(
            f"Generado el {date.today().strftime('%d/%m/%Y')} por UniFinanzas",
            meta_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer

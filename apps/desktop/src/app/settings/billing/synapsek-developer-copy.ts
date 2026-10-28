import type { Locale } from '@/i18n'

export const developerCopy: Record<Locale, { plan: string; quota: string; usage: string }> = {
  it: {
    plan: 'Accesso sviluppatore',
    quota: 'Nessun limite mensile di crediti; restano attivi i limiti per richiesta e di frequenza.',
    usage: 'Utilizzo a carico di Synapsek'
  },
  en: {
    plan: 'Developer access',
    quota: 'No monthly credit quota',
    usage:
      'Synapsek sponsors this account’s desktop model usage. Purchased credits are not charged. Usage is recorded; request and rate limits still apply.'
  },
  es: {
    plan: 'Acceso de desarrollador',
    quota: 'Sin cuota mensual de créditos',
    usage:
      'Synapsek cubre el uso de modelos de escritorio de esta cuenta. No se descuentan créditos comprados. Se registra el uso y se mantienen los límites por solicitud y de frecuencia.'
  },
  fr: {
    plan: 'Accès développeur',
    quota: 'Sans quota mensuel de crédits',
    usage:
      'Synapsek finance les modèles de bureau de ce compte. Les crédits achetés ne sont pas débités. L’utilisation est enregistrée ; les limites par requête et de fréquence restent en vigueur.'
  },
  de: {
    plan: 'Entwicklerzugang',
    quota: 'Kein monatliches Kreditlimit',
    usage:
      'Synapsek übernimmt die Desktop-Modellnutzung dieses Kontos. Gekaufte Credits werden nicht belastet. Die Nutzung wird erfasst; Anfrage- und Ratenlimits gelten weiterhin.'
  },
  ja: {
    plan: '開発者アクセス',
    quota: '月間クレジット上限なし',
    usage:
      'このアカウントのデスクトップでのモデル利用費用はSynapsekが負担します。購入済みクレジットは消費されません。利用状況は記録され、リクエストと頻度の制限は引き続き適用されます。'
  },
  ru: {
    plan: 'Доступ разработчика',
    quota: 'Без месячной квоты кредитов',
    usage:
      'Synapsek оплачивает использование моделей в приложении для этого аккаунта. Купленные кредиты не списываются. Использование учитывается; ограничения запросов и их частоты сохраняются.'
  },
  ar: {
    plan: 'وصول المطوّر',
    quota: 'بلا حصة شهرية للرصيد',
    usage:
      'تتحمل Synapsek تكلفة استخدام النماذج في تطبيق سطح المكتب لهذا الحساب. لا يُخصم الرصيد المشترى. يُسجَّل الاستخدام وتظل حدود الطلبات ومعدلها سارية.'
  },
  zh: {
    plan: '开发者访问',
    quota: '无每月积分限额',
    usage: 'Synapsek 承担此账户的桌面模型使用费用，不扣除已购买积分。使用量仍会记录，单次请求和频率限制仍然有效。'
  },
  'zh-hant': {
    plan: '開發者存取',
    quota: '無每月點數上限',
    usage: 'Synapsek 負擔此帳戶的桌面模型使用費用，不扣除已購買點數。使用量仍會記錄，單次請求與頻率限制仍然有效。'
  }
}

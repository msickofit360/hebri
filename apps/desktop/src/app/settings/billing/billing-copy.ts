import type { Locale } from '@/i18n'

interface BillingCopy {
  plan: string
  manage: string
  buy: string
  unavailable: string
  managed: string
  disabled: string
  website: string
}
export const billingCopy: Record<Locale, BillingCopy> = {
  en: {
    plan: 'Current plan',
    manage: 'Manage plan',
    buy: 'Buy credits',
    unavailable: 'Balance unavailable. Refresh or view billing on Synapsek.',
    managed: 'Admin-managed access. This grant does not include a paid subscription or a monthly credit allowance.',
    disabled: 'Synapsek-funded inference is not enabled for this device. Your other model providers remain available.',
    website:
      'Plan changes, invoices and credit purchases open on Synapsek. Credit packs require an eligible paid subscription.'
  },
  de: {
    plan: 'Aktueller Tarif',
    manage: 'Tarif verwalten',
    buy: 'Credits kaufen',
    unavailable: 'Guthaben nicht verfügbar. Aktualisiere die Ansicht oder öffne Synapsek.',
    managed: 'Administrativ verwalteter Zugang ohne kostenpflichtiges Abonnement oder monatliches Credit-Kontingent.',
    disabled:
      'Synapsek-finanzierte Inferenz ist für dieses Gerät nicht aktiviert. Andere Modellanbieter bleiben verfügbar.',
    website:
      'Tarifänderungen, Rechnungen und Credit-Käufe öffnen sich auf Synapsek. Credit-Pakete erfordern ein berechtigtes kostenpflichtiges Abonnement.'
  },
  es: {
    plan: 'Plan actual',
    manage: 'Gestionar plan',
    buy: 'Comprar créditos',
    unavailable: 'Saldo no disponible. Actualiza o consulta la facturación en Synapsek.',
    managed: 'Acceso administrado sin suscripción de pago ni asignación mensual de créditos.',
    disabled:
      'La inferencia financiada por Synapsek no está habilitada para este dispositivo. Otros proveedores siguen disponibles.',
    website:
      'Los cambios de plan, facturas y compras se abren en Synapsek. Los paquetes requieren una suscripción de pago compatible.'
  },
  fr: {
    plan: 'Offre actuelle',
    manage: 'Gérer mon offre',
    buy: 'Acheter des crédits',
    unavailable: 'Solde indisponible. Actualisez ou consultez la facturation sur Synapsek.',
    managed: 'Accès administré sans abonnement payant ni allocation mensuelle de crédits.',
    disabled:
      'L’inférence financée par Synapsek n’est pas activée pour cet appareil. Vos autres fournisseurs restent disponibles.',
    website:
      'Les offres, factures et achats s’ouvrent sur Synapsek. Les packs nécessitent un abonnement payant éligible.'
  },
  ja: {
    plan: '現在のプラン',
    manage: 'プランを管理',
    buy: 'クレジットを購入',
    unavailable: '残高を取得できません。更新するか Synapsek の請求画面をご確認ください。',
    managed: '管理者によるアクセス権です。有料契約や月間クレジットは含まれません。',
    disabled:
      'このデバイスでは Synapsek クレジットによる推論が有効ではありません。他のモデルプロバイダーは利用できます。',
    website: 'プラン変更、請求書、購入は Synapsek で開きます。クレジット購入には対象の有料契約が必要です。'
  },
  ru: {
    plan: 'Текущий тариф',
    manage: 'Управлять тарифом',
    buy: 'Купить кредиты',
    unavailable: 'Баланс недоступен. Обновите или откройте оплату в Synapsek.',
    managed: 'Доступ от администратора не включает платную подписку или ежемесячные кредиты.',
    disabled: 'Оплачиваемый Synapsek инференс не включён для этого устройства. Другие провайдеры доступны.',
    website: 'Тарифы, счета и покупки открываются в Synapsek. Пакеты кредитов требуют подходящей платной подписки.'
  },
  ar: {
    plan: 'الخطة الحالية',
    manage: 'إدارة الخطة',
    buy: 'شراء أرصدة',
    unavailable: 'الرصيد غير متاح. حدّث الصفحة أو افتح الفوترة في Synapsek.',
    managed: 'وصول يديره المسؤول ولا يتضمن اشتراكًا مدفوعًا أو رصيدًا شهريًا.',
    disabled: 'الاستدلال الممول من Synapsek غير مفعّل لهذا الجهاز. يبقى مزودو النماذج الآخرون متاحين.',
    website: 'تُفتح الخطط والفواتير والمشتريات في Synapsek. تتطلب حزم الأرصدة اشتراكًا مدفوعًا مؤهلاً.'
  },
  zh: {
    plan: '当前套餐',
    manage: '管理套餐',
    buy: '购买积分',
    unavailable: '余额暂不可用。请刷新或前往 Synapsek 账单页面。',
    managed: '管理员授予的访问权限，不包含付费订阅或每月积分。',
    disabled: '此设备尚未启用 Synapsek 积分推理。其他模型提供商仍可使用。',
    website: '套餐、发票和积分购买将在 Synapsek 打开。购买积分包需要符合条件的付费订阅。'
  },
  'zh-hant': {
    plan: '目前方案',
    manage: '管理方案',
    buy: '購買點數',
    unavailable: '餘額暫時無法取得。請重新整理或開啟 Synapsek 帳單頁面。',
    managed: '管理員授予的存取權，不包含付費訂閱或每月點數。',
    disabled: '此裝置尚未啟用 Synapsek 點數推論。其他模型供應商仍可使用。',
    website: '方案、發票與點數購買會在 Synapsek 開啟。購買點數包需要符合資格的付費訂閱。'
  }
}

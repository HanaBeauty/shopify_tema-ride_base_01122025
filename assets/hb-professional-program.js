(function () {
  const ROOT_SELECTOR = '[data-hb-pro-program]';
  const GLOBAL_INIT_KEY = '__hbProProgramInitAll';
  const DEFAULT_WHATSAPP_PHONE = '5511947393315';

  function getContext(scope) {
    if (scope && typeof scope.querySelectorAll === 'function') {
      return scope;
    }

    return document;
  }

  function toBaseTitle(title) {
    if (typeof title !== 'string') return '';

    const separators = [' — ', ' – ', ' | ', ' - ', ': '];
    let result = title;

    separators.some((separator) => {
      const index = result.indexOf(separator);
      if (index > -1) {
        result = result.slice(0, index);
        return true;
      }
      return false;
    });

    return result.trim();
  }

  function getVolumeLabel(selectValue, customInput) {
    if (selectValue === 'custom' && customInput) {
      const parsed = Number.parseInt(customInput.value, 10);
      return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '';
    }

    return selectValue || '';
  }

  function toggleCustomInput(input, shouldShow) {
    if (!input) return;

    input.toggleAttribute('hidden', !shouldShow);
    if (shouldShow) {
      input.focus();
    } else {
      input.value = '';
    }
  }

  function buildMessage({ baseTitle, volume, frequency, sku }) {
    const volumeLabel = volume ? `${volume} un` : '— un';
    const frequencyLabel = frequency || 'Mensal';
    const skuLabel = sku || '';

    return [
      'Olá, sou profissional e tenho interesse em CONDIÇÃO PROFISSIONAL / CONTRATO DE FORNECIMENTO.',
      '',
      `Produto: ${baseTitle}`,
      `Quantidade mensal desejada: ${volumeLabel}`,
      `Frequência: ${frequencyLabel}`,
      `SKU: ${skuLabel}`,
      '',
      'Necessito: preço por volume, estabilidade de abastecimento e prazos garantidos.',
      'Nome/Razão Social:',
      'CNPJ/CPF:',
      'Cidade:',
      'UF:',
      'CEP:',
    ].join('\n');
  }

  function getWhatsappBaseUrl(phone) {
    const sanitized = (phone || '').replace(/\D+/g, '') || DEFAULT_WHATSAPP_PHONE;
    return `https://wa.me/${sanitized}`;
  }

  function updateLink({
    button,
    phone,
    baseTitle,
    volume,
    frequency,
    sku,
  }) {
    if (!button) return;

    const message = buildMessage({ baseTitle, volume, frequency, sku });
    const normalizedPhone = (phone || DEFAULT_WHATSAPP_PHONE).replace(/\D+/g, '') || DEFAULT_WHATSAPP_PHONE;
    const searchParams = new URLSearchParams({
      text: message,
      utm_source: 'produto',
      utm_medium: 'whatsapp',
      utm_campaign: 'pro-volume',
    });

    const url = `${getWhatsappBaseUrl(normalizedPhone)}?${searchParams.toString()}`;
    button.setAttribute('href', url);
  }

  function init(root) {
    if (!root || root.dataset.hbProProgramInit === 'true') return;

    const phone = root.dataset.whatsappPhone || DEFAULT_WHATSAPP_PHONE;
    const baseTitle = toBaseTitle(root.dataset.productTitle || '');
    const sku = root.dataset.productSku || '';
    const volumeSelect = root.querySelector('[data-hb-pro-volume]');
    const customVolumeInput = root.querySelector('[data-hb-pro-volume-custom]');
    const frequencySelect = root.querySelector('[data-hb-pro-frequency]');
    const button = root.querySelector('[data-hb-pro-whats]');

    if (!volumeSelect || !frequencySelect || !button) {
      root.dataset.hbProProgramInit = 'true';
      return;
    }

    const state = {
      get volume() {
        return getVolumeLabel(volumeSelect.value, customVolumeInput);
      },
      get frequency() {
        return frequencySelect.value || 'Mensal';
      },
    };

    const refreshLink = () => {
      updateLink({
        button,
        phone,
        baseTitle,
        volume: state.volume,
        frequency: state.frequency,
        sku,
      });
    };

    volumeSelect.addEventListener('change', () => {
      const isCustom = volumeSelect.value === 'custom';
      toggleCustomInput(customVolumeInput, isCustom);
      refreshLink();
    });

    ['input', 'change'].forEach((eventName) => {
      customVolumeInput?.addEventListener(eventName, refreshLink);
    });

    frequencySelect.addEventListener('change', refreshLink);

    refreshLink();

    root.dataset.hbProProgramInit = 'true';
  }

  function initAll(scope) {
    const context = getContext(scope);
    context.querySelectorAll(ROOT_SELECTOR).forEach(init);
  }

  function handleSectionUnload({ target }) {
    getContext(target)
      .querySelectorAll(ROOT_SELECTOR)
      .forEach((root) => {
        delete root.dataset.hbProProgramInit;
      });
  }

  if (window[GLOBAL_INIT_KEY]) {
    window[GLOBAL_INIT_KEY](document);
    return;
  }

  window[GLOBAL_INIT_KEY] = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(document));
  } else {
    initAll(document);
  }

  document.addEventListener('product-info:loaded', ({ target }) => initAll(target));
  document.addEventListener('shopify:section:load', ({ target }) => initAll(target));
  document.addEventListener('shopify:section:unload', handleSectionUnload);
})();

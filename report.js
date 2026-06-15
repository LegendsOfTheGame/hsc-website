/* ═══════════════════════════════════════════════════
   HAMMER STREET CLEAN — report.js
   Report Page: GPS · Photo · Form Submission → Supabase
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────── */
  const SUPABASE_URL      = 'https://cgznyjlcimsxdjdtyirj.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_3hUkDN1jGZvC4G9dM-QySA_BZiqW8az';
  const IMGBB_API_KEY     = '2972e511acdd923ba33c1bedd2af2ae7';
  const IMGBB_URL         = 'https://api.imgbb.com/1/upload';

  const MAX_PHOTO_MB   = 10;
  const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;

  /* ── STATE ──────────────────────────────────────── */
  let gpsCoords = { lat: null, lng: null, accuracy: null };
  let photoBase64 = null;
  let photoMimeType = null;

  /* ── DOM REFS ────────────────────────────────────── */
  const form            = document.getElementById('report-form');
  const successPanel    = document.getElementById('report-success');
  const submitBtn       = document.getElementById('submit-btn');
  const submitAnother   = document.getElementById('submit-another-btn');
  const errorBanner     = document.getElementById('form-error-banner');

  const gpsStatusBar    = document.getElementById('gps-status-bar');
  const gpsStatusText   = document.getElementById('gps-status-text');
  const gpsRetryBtn     = document.getElementById('gps-retry-btn');
  const coordLat        = document.getElementById('coord-lat');
  const coordLng        = document.getElementById('coord-lng');
  const coordAccuracy   = document.getElementById('coord-accuracy');
  const fieldLat        = document.getElementById('field-lat');
  const fieldLng        = document.getElementById('field-lng');
  const fieldAccuracy   = document.getElementById('field-accuracy');

  const photoInput      = document.getElementById('photo-input');
  const photoUploadArea = document.getElementById('photo-upload-area');
  const photoPlaceholder= document.getElementById('photo-placeholder');
  const photoPreviewWrap= document.getElementById('photo-preview-wrap');
  const photoPreview    = document.getElementById('photo-preview');
  const photoRemoveBtn  = document.getElementById('photo-remove-btn');

  const reportTypeRadios= document.querySelectorAll('input[name="report_type"]');
  const addendumGroup   = document.getElementById('addendum-ref-group');
  const issueTypeRadios = document.querySelectorAll('input[name="issue_type"]');
  const otherIssueGroup = document.getElementById('other-issue-group');

  /* ── GPS ─────────────────────────────────────────── */
  function requestGPS() {
    if (!navigator.geolocation) {
      setGPSStatus('error', 'GPS not available on this device.');
      return;
    }

    setGPSStatus('waiting', 'Requesting your location…');
    gpsRetryBtn.style.display = 'none';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsCoords = {
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: Math.round(pos.coords.accuracy)
        };

        coordLat.textContent = gpsCoords.lat;
        coordLng.textContent = gpsCoords.lng;
        coordLat.classList.add('has-value');
        coordLng.classList.add('has-value');
        coordAccuracy.textContent = `Accuracy: ±${gpsCoords.accuracy}m`;
        fieldLat.value      = gpsCoords.lat;
        fieldLng.value      = gpsCoords.lng;
        fieldAccuracy.value = gpsCoords.accuracy;

        setGPSStatus('ok', `Location captured (±${gpsCoords.accuracy}m accuracy)`);
      },
      (err) => {
        let msg = 'Location access denied.';
        if (err.code === err.TIMEOUT)         msg = 'GPS timed out. Please retry.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable.';
        setGPSStatus('error', msg + ' You can still submit with the address field.');
        gpsRetryBtn.style.display = 'inline-block';
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function setGPSStatus(state, message) {
    gpsStatusText.textContent = message;
    gpsStatusBar.classList.remove('gps-ok', 'gps-error');
    if (state === 'ok')    gpsStatusBar.classList.add('gps-ok');
    if (state === 'error') gpsStatusBar.classList.add('gps-error');
  }

  if (gpsRetryBtn) gpsRetryBtn.addEventListener('click', requestGPS);
  requestGPS();

  /* ── REPORT TYPE TOGGLE ──────────────────────────── */
  reportTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const isAddendum = radio.value === 'Addendum' && radio.checked;
      addendumGroup.style.display = isAddendum ? 'flex' : 'none';
      const refInput = document.getElementById('ref-number');
      if (refInput) refInput.required = isAddendum;
    });
  });

  /* ── ISSUE TYPE: show "other" field ─────────────── */
  issueTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const showOther = radio.value === 'Other' && radio.checked;
      otherIssueGroup.style.display = showOther ? 'flex' : 'none';
    });
  });

  /* ── PHOTO UPLOAD ────────────────────────────────── */
  photoUploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      photoInput.click();
    }
  });

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      showError(`Photo is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${MAX_PHOTO_MB}MB.`);
      photoInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result; // data:image/jpeg;base64,...
      const parts  = result.split(',');
      photoBase64  = parts[1];
      photoMimeType = file.type || 'image/jpeg';

      photoPreview.src = result;
      photoPlaceholder.style.display  = 'none';
      photoPreviewWrap.style.display  = 'block';
      photoUploadArea.classList.add('has-photo');
      clearError();
    };
    reader.readAsDataURL(file);
  });

  photoRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    photoBase64 = null;
    photoMimeType = null;
    photoInput.value = '';
    photoPreview.src = '';
    photoPlaceholder.style.display  = 'flex';
    photoPreviewWrap.style.display  = 'none';
    photoUploadArea.classList.remove('has-photo');
  });

  /* ── FORM VALIDATION ─────────────────────────────── */
  function validateForm() {
    const errors = [];

    // Issue type
    const issueType = form.querySelector('input[name="issue_type"]:checked');
    if (!issueType) errors.push('Please select a type of issue.');

    // Location text
    const locationText = document.getElementById('location-text');
    if (!locationText.value.trim()) {
      locationText.classList.add('error');
      errors.push('Please enter the nearest intersection or address.');
    } else {
      locationText.classList.remove('error');
    }

    // Notes
    const notes = document.getElementById('notes');
    if (!notes.value.trim()) {
      notes.classList.add('error');
      errors.push('Please add a brief description.');
    } else {
      notes.classList.remove('error');
    }

    // Addendum ref
    const isAddendum = form.querySelector('input[name="report_type"]:checked')?.value === 'Addendum';
    if (isAddendum) {
      const ref = document.getElementById('ref-number');
      if (!ref.value.trim()) {
        ref.classList.add('error');
        errors.push('Please enter the reference number for your existing report.');
      } else {
        ref.classList.remove('error');
      }
    }

    // Email format if provided
    const emailField = document.getElementById('reporter-email');
    if (emailField.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.classList.add('error');
      errors.push('Please enter a valid email address, or leave it blank.');
    } else {
      emailField.classList.remove('error');
    }

    return errors;
  }

  /* ── FORM SUBMISSION ─────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const errors = validateForm();
    if (errors.length) {
      showError(errors.join(' '));
      // Scroll to first error field
      const firstErr = form.querySelector('.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Collect form values
    const ref         = generateRef();
    const issueType   = form.querySelector('input[name="issue_type"]:checked')?.value || '';
    const issueOther  = document.getElementById('other-issue-text').value.trim();
    const notes       = document.getElementById('notes').value.trim();
    const severity    = document.getElementById('severity').value;
    const name        = document.getElementById('reporter-name').value.trim();
    const phone       = document.getElementById('reporter-phone').value.trim();
    const email       = document.getElementById('reporter-email').value.trim();
    const followup    = form.querySelector('input[name="request_followup"]')?.checked ? 'Yes' : 'No';

    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.querySelector('.submit-label').textContent = 'Submitting…';
    submitBtn.querySelector('.submit-spinner').style.display = 'inline';

    // Upload photo first so imageUrl is ready when building the row
    let imageUrl = null;
    if (photoBase64) {
      try {
        submitBtn.querySelector('.submit-label').textContent = 'Uploading photo…';
        const fd = new FormData();
        fd.append('key', IMGBB_API_KEY);
        fd.append('image', photoBase64);
        const imgRes  = await fetch(IMGBB_URL, { method: 'POST', body: fd });
        const imgJson = await imgRes.json();
        if (imgJson.success) imageUrl = imgJson.data.url;
        submitBtn.querySelector('.submit-label').textContent = 'Submitting…';
      } catch {
        // Photo upload failed — submit without it rather than blocking the report
      }
    }

    // Build payload
    const descParts = [
      `${issueType}${issueOther ? ' — ' + issueOther : ''}${severity ? ' | ' + severity : ''}`,
      notes,
    ];
    if (name || email || phone) {
      const contact = [name, email, phone].filter(Boolean).join(' | ');
      descParts.push(`Reporter: ${contact} | Follow-up: ${followup}`);
    }

    const row = {
      date:           new Date().toISOString().slice(0, 10),
      location:       document.getElementById('location-text').value.trim(),
      description:    descParts.filter(Boolean).join('\n\n'),
      image_url:      imageUrl,
      source:         'citizen_form',
      source_id:      ref,
      status:         'pending',
      sync_timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/incoming_reports`, {
        method: 'POST',
        headers: {
          'apikey':       SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer':       'return=minimal',
        },
        body: JSON.stringify(row),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${response.status}`);
      }

      showSuccess(ref);

    } catch (err) {
      console.error('Submission error:', err);
      showError('Something went wrong submitting your report. Please try again, or contact us directly at 365-357-2405.');
      submitBtn.disabled = false;
      submitBtn.querySelector('.submit-label').textContent = 'Submit Report';
      submitBtn.querySelector('.submit-spinner').style.display = 'none';
    }
  });

  /* ── SUCCESS ─────────────────────────────────────── */
  function showSuccess(ref) {
    form.style.display = 'none';
    successPanel.style.display = 'block';

    const refEl = document.getElementById('success-ref');
    if (refEl) refEl.textContent = `Reference: ${ref}`;

    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function generateRef() {
    const now = new Date();
    const yr  = now.getFullYear();
    const mo  = String(now.getMonth() + 1).padStart(2, '0');
    const dy  = String(now.getDate()).padStart(2, '0');
    const m1 = mo[0], m2 = mo[1], d1 = dy[0], d2 = dy[1];
    const patterns = [
      mo + dy,               // MMDD
      m1 + d1 + m2 + d2,    // MDMD
      d1 + m1 + d2 + m2,    // DMDM
      dy + mo,               // DDMM
    ];
    return `HSC-${yr}-${patterns[Math.floor(Math.random() * 4)]}`;
  }

  /* ── RESET / SUBMIT ANOTHER ──────────────────────── */
  if (submitAnother) {
    submitAnother.addEventListener('click', () => {
      form.reset();
      photoBase64 = null;
      photoMimeType = null;
      photoPreview.src = '';
      photoPlaceholder.style.display  = 'flex';
      photoPreviewWrap.style.display  = 'none';
      photoUploadArea.classList.remove('has-photo');
      coordLat.textContent = '—';
      coordLng.textContent = '—';
      coordLat.classList.remove('has-value');
      coordLng.classList.remove('has-value');
      coordAccuracy.textContent = '';
      gpsCoords = { lat: null, lng: null, accuracy: null };
      addendumGroup.style.display = 'none';
      otherIssueGroup.style.display = 'none';

      form.style.display = 'block';
      successPanel.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.querySelector('.submit-label').textContent = 'Submit Report';
      submitBtn.querySelector('.submit-spinner').style.display = 'none';

      // Re-grab GPS
      requestGPS();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── ERROR HELPERS ───────────────────────────────── */
  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.style.display = 'block';
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function clearError() {
    errorBanner.textContent = '';
    errorBanner.style.display = 'none';
  }

})();

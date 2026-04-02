import { supabase } from './supabaseClient.js';

let invitationToken = null;
let invitationEmail = null;

async function verifyInvitation() {
  const urlParams = new URLSearchParams(window.location.search);
  invitationToken = urlParams.get('token');

  if (!invitationToken) {
    showExpired();
    return;
  }

  try {
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', invitationToken)
      .maybeSingle();

    if (error) throw error;

    if (!invitation) {
      showExpired();
      return;
    }

    if (invitation.accepted_at) {
      showExpired('This invitation has already been used.');
      return;
    }

    if (new Date(invitation.expires_at) < new Date()) {
      showExpired('This invitation has expired.');
      return;
    }

    invitationEmail = invitation.email;
    showSignupForm();
  } catch (error) {
    console.error('Error verifying invitation:', error);
    showExpired();
  }
}

function showExpired(message) {
  document.getElementById('loadingMessage').classList.add('hidden');
  document.getElementById('expiredMessage').classList.remove('hidden');
  if (message) {
    document.querySelector('#expiredMessage h2').textContent = 'Invalid Invitation';
    document.querySelector('#expiredMessage p').textContent = message;
  }
}

function showSignupForm() {
  document.getElementById('loadingMessage').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
  document.getElementById('inviteEmail').textContent = `Creating account for: ${invitationEmail}`;
}

function showSuccess() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('successMessage').classList.remove('hidden');
  setTimeout(() => {
    window.location.href = '/admin.html';
  }, 2000);
}

async function handleSignup(e) {
  e.preventDefault();

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorEl = document.getElementById('signupError');

  errorEl.classList.add('hidden');

  if (password !== confirmPassword) {
    errorEl.textContent = 'Passwords do not match';
    errorEl.classList.remove('hidden');
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: invitationEmail,
      password
    });

    if (error) throw error;

    await supabase
      .from('user_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('invitation_token', invitationToken);

    showSuccess();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('acceptInviteForm').addEventListener('submit', handleSignup);
  verifyInvitation();
});

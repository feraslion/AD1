import React from 'react';
import { renderToString } from 'react-dom/server';
import Modal from '../shared/components/ui/Modal';

console.log('=== Running Modal Accessibility Unit Tests ===');

// Test 1: Verify Modal renders dialog attributes, aria-labelledby, and focus ring classes
const htmlOutput = renderToString(
  React.createElement(Modal, {
    isOpen: true,
    onClose: () => {},
    title: 'عنوان النافذة (Modal Title)',
    children: React.createElement('div', null, 'Modal Content'),
  })
);

if (!htmlOutput.includes('role="dialog"')) {
  throw new Error('Test 1 Failed: Modal is missing role="dialog"');
}

if (!htmlOutput.includes('aria-modal="true"')) {
  throw new Error('Test 1 Failed: Modal is missing aria-modal="true"');
}

if (!htmlOutput.includes('aria-labelledby="modal-title-')) {
  throw new Error('Test 1 Failed: Modal is missing dynamic aria-labelledby attribute');
}

if (!htmlOutput.includes('id="modal-title-')) {
  throw new Error('Test 1 Failed: Header title is missing dynamic id attribute');
}

if (!htmlOutput.includes('focus-visible:ring-2')) {
  throw new Error('Test 1 Failed: Close button is missing focus-visible ring classes');
}

console.log('✔ Test 1 Passed: Modal renders role="dialog", aria-modal="true", aria-labelledby, and focus visible indicators.');

// Test 2: Verify Modal returns null when isOpen is false
const closedHtmlOutput = renderToString(
  React.createElement(Modal, {
    isOpen: false,
    onClose: () => {},
    title: 'عنوان النافذة (Modal Title)',
    children: React.createElement('div', null, 'Modal Content'),
  })
);

if (closedHtmlOutput !== '') {
  throw new Error('Test 2 Failed: Closed Modal should render nothing');
}

console.log('✔ Test 2 Passed: Modal renders nothing when isOpen is false.');
console.log('=== All Modal Accessibility Unit Tests Passed Successfully! ===');

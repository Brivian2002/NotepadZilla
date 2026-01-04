class NotepadZilla {
    constructor() {
        this.currentNoteId = 'current_note';
        this.notesKey = 'notepadzilla_notes';
        this.settingsKey = 'notepadzilla_settings';
        this.autoSaveInterval = 3000;
        this.autoSaveTimer = null;
        this.isSaving = false;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.setupEditor();
        this.loadCurrentNote();
        this.loadNotesList();
        this.startAutoSave();
        this.setupWelcomeModal();
        this.setupPageNavigation();
        this.setupFAQ();
        this.setupGoogleForm();
        
        this.updateWordCount();
        this.checkBrowserCompatibility();
        
        // Apply dark mode if enabled
        if (this.settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('toggleDarkMode').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem(this.settingsKey)) || {
            darkMode: false,
            fontSize: '4',
            fontFamily: 'Arial, sans-serif',
            lastActiveNote: null
        };
        
        this.settings = settings;
    }

    saveSettings() {
        localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    }

    setupEventListeners() {
        // Dark mode toggle
        document.getElementById('toggleDarkMode').addEventListener('click', () => this.toggleDarkMode());
        
        // Menu toggle for mobile
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('show');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-links') && !e.target.closest('.menu-toggle')) {
                document.querySelector('.nav-links').classList.remove('show');
            }
        });
        
        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.closest('.toolbar-btn').dataset.command;
                this.executeCommand(command);
                this.updateToolbarState();
            });
        });
        
        // Font controls
        document.getElementById('fontSize').addEventListener('change', (e) => {
            this.executeCommand('fontSize', e.target.value);
            this.settings.fontSize = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.executeCommand('fontName', e.target.value);
            this.settings.fontFamily = e.target.value;
            this.saveSettings();
        });
        
        // Color pickers
        document.getElementById('textColor').addEventListener('change', (e) => {
            this.executeCommand('foreColor', e.target.value);
        });
        
        document.getElementById('highlightColor').addEventListener('change', (e) => {
            this.executeCommand('hiliteColor', e.target.value);
        });
        
        // Action buttons
        document.getElementById('saveNote').addEventListener('click', () => this.saveCurrentNote());
        document.getElementById('newNote').addEventListener('click', () => this.createNewNote());
        document.getElementById('loadNote').addEventListener('click', () => this.toggleNotesSidebar());
        document.getElementById('downloadNote').addEventListener('click', () => this.exportNote());
        document.getElementById('printNote').addEventListener('click', () => window.print());
        document.getElementById('clearFormatting').addEventListener('click', () => this.clearAllFormatting());
        document.getElementById('toggleFullscreen').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('closeSidebar').addEventListener('click', () => this.toggleNotesSidebar());
        document.getElementById('closeWelcome').addEventListener('click', () => this.closeWelcomeModal());
        
        // Document title
        document.getElementById('documentTitle').addEventListener('input', () => {
            this.showSavingStatus();
        });
        
        // Editor content changes
        document.getElementById('richTextEditor').addEventListener('input', () => {
            this.updateWordCount();
            this.showSavingStatus();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Save: Ctrl+S
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
            }
            
            // New: Ctrl+N
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewNote();
            }
            
            // Print: Ctrl+P
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
            
            // Bold: Ctrl+B
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.executeCommand('bold');
                this.updateToolbarState();
            }
            
            // Italic: Ctrl+I
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.executeCommand('italic');
                this.updateToolbarState();
            }
            
            // Underline: Ctrl+U
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                this.executeCommand('underline');
                this.updateToolbarState();
            }
        });
        
        // Before unload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
        
        // Fullscreen change
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                document.body.classList.remove('fullscreen');
            }
        });
    }

    setupPageNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-links a[data-page], .back-link[data-page], .footer-section a[data-page], .footer-bottom a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.switchPage(page);
                
                // Update active state in nav
                document.querySelectorAll('.nav-links a').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                link.classList.add('active');
                
                // Close mobile menu
                document.querySelector('.nav-links').classList.remove('show');
            });
        });
    }

    setupFAQ() {
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isActive = answer.classList.contains('active');
                
                // Close all other FAQ answers
                document.querySelectorAll('.faq-answer').forEach(ans => {
                    ans.classList.remove('active');
                });
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.classList.remove('active');
                });
                
                // Toggle current answer
                if (!isActive) {
                    answer.classList.add('active');
                    question.classList.add('active');
                }
            });
        });
    }

    setupGoogleForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                // Validate form before submission
                if (!this.validateContactForm()) {
                    e.preventDefault();
                    return false;
                }
                
                // Show success message
                this.showNotification('Your message has been submitted! It will be recorded in our database. Thank you for contacting us.', 'success');
                
                // Store form data locally for reference
                this.storeFormData();
                
                // Clear form after 2 seconds
                setTimeout(() => {
                    contactForm.reset();
                }, 2000);
                
                return true;
            });
        }
    }

    validateContactForm() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value.trim();
        
        if (!name || !email || !subject || !message) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        return true;
    }

    storeFormData() {
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value.trim(),
            timestamp: new Date().toISOString()
        };
        
        // Store in localStorage for reference
        let submissions = JSON.parse(localStorage.getItem('notepadzilla_contact_submissions')) || [];
        submissions.unshift(formData);
        if (submissions.length > 50) submissions = submissions.slice(0, 50);
        localStorage.setItem('notepadzilla_contact_submissions', JSON.stringify(submissions));
    }

    switchPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Show selected page
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
            
            // If switching to home page, focus on editor
            if (page === 'home') {
                setTimeout(() => {
                    document.getElementById('richTextEditor').focus();
                }, 100);
            }
            
            // Update browser history
            history.pushState({ page }, '', `#${page}`);
        }
    }

    setupEditor() {
        const editor = document.getElementById('richTextEditor');
        
        // Prevent paste of formatting from external sources
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
        
        // Update toolbar state on selection change
        editor.addEventListener('mouseup', () => this.updateToolbarState());
        editor.addEventListener('keyup', () => this.updateToolbarState());
        
        // Apply font settings
        this.applyFontSettings();
    }

    executeCommand(command, value = null) {
        const editor = document.getElementById('richTextEditor');
        
        try {
            if (value) {
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false, null);
            }
            
            // Focus back on editor
            editor.focus();
        } catch (error) {
            console.error(`Error executing command ${command}:`, error);
        }
    }

    updateToolbarState() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        // Update button states
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            const command = btn.dataset.command;
            try {
                const isActive = document.queryCommandState(command);
                btn.classList.toggle('active', isActive);
            } catch (error) {
                // Some commands don't support queryCommandState
            }
        });
    }

    applyFontSettings() {
        const editor = document.getElementById('richTextEditor');
        editor.style.fontFamily = this.settings.fontFamily;
        editor.style.fontSize = this.getFontSizeFromValue(this.settings.fontSize);
        
        // Apply to select elements
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('fontFamily').value = this.settings.fontFamily;
    }

    getFontSizeFromValue(value) {
        const sizes = {
            '1': '8pt',
            '2': '10pt',
            '3': '12pt',
            '4': '14pt',
            '5': '18pt',
            '6': '24pt',
            '7': '36pt'
        };
        return sizes[value] || '14pt';
    }

    loadCurrentNote() {
        const note = JSON.parse(localStorage.getItem(this.currentNoteId)) || {
            id: Date.now().toString(),
            title: 'Untitled Document',
            content: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            wordCount: 0,
            charCount: 0
        };
        
        document.getElementById('documentTitle').value = note.title;
        document.getElementById('richTextEditor').innerHTML = note.content || '';
        
        // Update last saved time
        if (note.updatedAt) {
            const date = new Date(note.updatedAt);
            document.getElementById('lastSaved').textContent = this.formatDate(date);
        }
        
        this.currentNote = note;
    }

    saveCurrentNote() {
        if (this.isSaving) return;
        
        this.isSaving = true;
        const title = document.getElementById('documentTitle').value.trim() || 'Untitled Document';
        const content = document.getElementById('richTextEditor').innerHTML;
        const now = Date.now();
        
        const note = {
            id: this.currentNote?.id || Date.now().toString(),
            title: title,
            content: content,
            preview: this.getTextPreview(content),
            createdAt: this.currentNote?.createdAt || now,
            updatedAt: now,
            wordCount: this.getWordCount(content),
            charCount: content.length
        };
        
        // Save current note
        localStorage.setItem(this.currentNoteId, JSON.stringify(note));
        
        // Save to notes list
        this.saveToNotesList(note);
        
        // Update current note reference
        this.currentNote = note;
        
        // Update UI
        this.showSavedStatus();
        this.loadNotesList();
        
        // Update last saved time
        document.getElementById('lastSaved').textContent = 'Just now';
        
        this.isSaving = false;
        
        // Show notification
        this.showNotification('Note saved successfully!', 'success');
    }

    saveToNotesList(note) {
        let notes = JSON.parse(localStorage.getItem(this.notesKey)) || [];
        
        // Remove existing note with same id
        notes = notes.filter(n => n.id !== note.id);
        
        // Add to beginning
        notes.unshift(note);
        
        // Keep only last 100 notes
        if (notes.length > 100) {
            notes = notes.slice(0, 100);
        }
        
        localStorage.setItem(this.notesKey, JSON.stringify(notes));
    }

    loadNotesList() {
        const notes = JSON.parse(localStorage.getItem(this.notesKey)) || [];
        const notesList = document.getElementById('notesList');
        
        if (notes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-notes">
                    <i class="fas fa-sticky-note" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; display: block; text-align: center;"></i>
                    <p style="color: var(--text-secondary); text-align: center;">No notes yet. Create your first note!</p>
                </div>
            `;
            return;
        }
        
        notesList.innerHTML = notes.map(note => `
            <div class="note-item ${note.id === this.currentNote?.id ? 'active' : ''}" 
                 data-note-id="${note.id}"
                 onclick="notepadZilla.loadNoteById('${note.id}')">
                <div class="note-title">${this.escapeHtml(note.title)}</div>
                <div class="note-preview">${this.escapeHtml(note.preview)}</div>
                <div class="note-meta">
                    <span>${this.formatDate(new Date(note.updatedAt))}</span>
                    <span>${note.wordCount} words</span>
                </div>
            </div>
        `).join('');
    }

    loadNoteById(noteId) {
        const notes = JSON.parse(localStorage.getItem(this.notesKey)) || [];
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            // Save current note first
            this.saveCurrentNote();
            
            // Load selected note
            document.getElementById('documentTitle').value = note.title;
            document.getElementById('richTextEditor').innerHTML = note.content;
            
            // Update current note reference
            this.currentNote = note;
            
            // Update last saved
            document.getElementById('lastSaved').textContent = 'Loaded';
            
            // Update word count
            this.updateWordCount();
            
            // Close sidebar
            this.toggleNotesSidebar();
            
            // Show notification
            this.showNotification('Note loaded successfully!', 'success');
            
            // Focus on editor
            document.getElementById('richTextEditor').focus();
            
            setTimeout(() => {
                document.getElementById('lastSaved').textContent = 'Ready';
            }, 2000);
        }
    }

    createNewNote() {
        // Save current note before creating new one
        this.saveCurrentNote();
        
        // Create new note
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Document',
            content: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            wordCount: 0,
            charCount: 0
        };
        
        // Update UI
        document.getElementById('documentTitle').value = newNote.title;
        document.getElementById('richTextEditor').innerHTML = '';
        document.getElementById('lastSaved').textContent = 'New document';
        
        // Update current note reference
        this.currentNote = newNote;
        
        // Clear toolbar active states
        document.querySelectorAll('.toolbar-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update word count
        this.updateWordCount();
        
        // Focus on editor
        document.getElementById('richTextEditor').focus();
        
        // Show notification
        this.showNotification('New note created!', 'success');
        
        setTimeout(() => {
            document.getElementById('lastSaved').textContent = 'Ready';
        }, 2000);
    }

    exportNote() {
        const title = document.getElementById('documentTitle').value.trim() || 'notepadzilla_note';
        const content = document.getElementById('richTextEditor').innerHTML;
        const textContent = document.getElementById('richTextEditor').textContent;
        
        // Create modal for export options
        const exportOptions = `
            <div style="padding: 1rem; text-align: center;">
                <h3 style="margin-bottom: 1rem;">Export Note</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <button onclick="notepadZilla.exportAsHTML('${this.escapeHtml(title)}', \`${this.escapeHtml(content)}\`)" 
                            class="btn-primary" style="width: 100%;">
                        <i class="fas fa-code"></i> Export as HTML
                    </button>
                    <button onclick="notepadZilla.exportAsTXT('${this.escapeHtml(title)}', \`${this.escapeHtml(textContent)}\`)" 
                            class="btn-primary" style="width: 100%;">
                        <i class="fas fa-file-alt"></i> Export as Text
                    </button>
                    <button onclick="notepadZilla.exportAsDOCX('${this.escapeHtml(title)}', \`${this.escapeHtml(content)}\`)" 
                            class="btn-primary" style="width: 100%;">
                        <i class="fas fa-file-word"></i> Export as DOCX
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('Export Options', exportOptions);
    }

    exportAsHTML(title, content) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6; 
                        padding: 40px; 
                        max-width: 800px; 
                        margin: 0 auto;
                        color: #333;
                    }
                    h1 { 
                        color: #2563eb; 
                        border-bottom: 2px solid #e5e7eb;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .content { 
                        margin-top: 20px;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        color: #6b7280;
                        font-size: 0.9rem;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="content">${content}</div>
                <div class="footer">
                    Exported from NotepadZilla on ${new Date().toLocaleDateString()}
                </div>
            </body>
            </html>
        `;
        
        this.downloadFile(htmlContent, `${title}.html`, 'text/html');
        this.showNotification('Exported as HTML successfully!', 'success');
    }

    exportAsTXT(title, content) {
        const txtContent = `${title}\n\n${content}\n\n---\nExported from NotepadZilla on ${new Date().toLocaleDateString()}`;
        this.downloadFile(txtContent, `${title}.txt`, 'text/plain');
        this.showNotification('Exported as Text successfully!', 'success');
    }

    exportAsDOCX(title, content) {
        // Simple DOCX simulation
        const docxContent = `Title: ${title}\n\n${this.stripHtml(content)}\n\nExported from NotepadZilla`;
        this.downloadFile(docxContent, `${title}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        this.showNotification('Exported as DOCX successfully!', 'success');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateWordCount() {
        const content = document.getElementById('richTextEditor').textContent;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        
        document.getElementById('wordCount').textContent = words;
        document.getElementById('wordCount2').textContent = words;
        document.getElementById('charCount').textContent = chars;
    }

    showSavingStatus() {
        document.getElementById('saveStatus').innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Saving...';
    }

    showSavedStatus() {
        document.getElementById('saveStatus').innerHTML = '<i class="fas fa-check-circle"></i> Saved';
        
        setTimeout(() => {
            document.getElementById('saveStatus').innerHTML = '<i class="fas fa-check-circle"></i> Ready';
        }, 3000);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showModal(title, content) {
        // Remove existing modal
        const existingModal = document.querySelector('.custom-modal');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1003;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background-color: var(--bg-primary); border-radius: var(--radius-lg); padding: 2rem; max-width: 500px; width: 90%; box-shadow: var(--shadow-lg);">
                <h2 style="margin-bottom: 1rem; color: var(--text-primary);">${title}</h2>
                ${content}
                <button onclick="this.closest('.custom-modal').remove()" 
                        style="margin-top: 1.5rem; width: 100%; padding: 0.75rem; background-color: var(--border-color); border: none; border-radius: var(--radius); cursor: pointer; color: var(--text-primary);">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.saveCurrentNote();
            }
        }, this.autoSaveInterval);
    }

    hasUnsavedChanges() {
        if (!this.currentNote) return true;
        
        const currentTitle = document.getElementById('documentTitle').value.trim() || 'Untitled Document';
        const currentContent = document.getElementById('richTextEditor').innerHTML;
        
        return this.currentNote.title !== currentTitle || 
               this.currentNote.content !== currentContent;
    }

    toggleDarkMode() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const icon = document.querySelector('#toggleDarkMode i');
        
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            icon.className = 'fas fa-moon';
            this.settings.darkMode = false;
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
            this.settings.darkMode = true;
        }
        
        this.saveSettings();
        this.showNotification(`Dark mode ${isDark ? 'disabled' : 'enabled'}`, 'info');
    }

    toggleNotesSidebar() {
        document.getElementById('notesSidebar').classList.toggle('open');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                this.showNotification('Fullscreen mode not supported', 'error');
            });
            document.body.classList.add('fullscreen');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                document.body.classList.remove('fullscreen');
            }
        }
    }

    clearAllFormatting() {
        const editor = document.getElementById('richTextEditor');
        const textContent = editor.textContent;
        editor.innerHTML = '';
        document.execCommand('insertText', false, textContent);
        
        // Clear toolbar active states
        document.querySelectorAll('.toolbar-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.showNotification('All formatting cleared', 'success');
    }

    setupWelcomeModal() {
        const hasSeenWelcome = localStorage.getItem('notepadzilla_welcome_seen');
        
        if (!hasSeenWelcome) {
            document.getElementById('welcomeModal').style.display = 'flex';
            localStorage.setItem('notepadzilla_welcome_seen', 'true');
        }
    }

    closeWelcomeModal() {
        document.getElementById('welcomeModal').style.display = 'none';
        this.showNotification('Welcome to NotepadZilla! Start typing your notes.', 'info');
    }

    getTextPreview(content, maxLength = 100) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        const text = temp.textContent || temp.innerText || '';
        return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    getWordCount(content) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        const text = temp.textContent || temp.innerText || '';
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }

    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        // Less than a minute ago
        if (diff < 60000) return 'Just now';
        
        // Less than an hour ago
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        
        // Less than a day ago
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        
        // Otherwise, show date
        return date.toLocaleDateString();
    }

    checkBrowserCompatibility() {
        if (!('localStorage' in window)) {
            this.showNotification('Warning: Your browser does not support local storage. Your notes will not be saved.', 'error');
            return;
        }
        
        // Check for required APIs
        if (!window.getSelection || !document.execCommand) {
            this.showNotification('Warning: Some formatting features may not work properly in your browser.', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notepadZilla = new NotepadZilla();
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            notepadZilla.switchPage(event.state.page);
        }
    });
    
    // Check for hash in URL
    const hash = window.location.hash.substring(1);
    if (hash && ['about', 'privacy', 'terms', 'contact'].includes(hash)) {
        notepadZilla.switchPage(hash);
        
        // Update active nav link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === hash) {
                link.classList.add('active');
            }
        });
    }
});

// Add CSS for font awesome spinner
const style = document.createElement('style');
style.textContent = `
    .fa-spin {
        animation: fa-spin 2s linear infinite;
    }
    
    @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .custom-modal {
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(style);

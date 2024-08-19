import { init as initDNAAnimation, updateMousePosition, handleControlButtonInteraction, resetView } from './dna-animation.js';
import { init as initBackgroundAnimation, toggleEasterEgg } from './background-animation.js';

let mouseX = 0, mouseY = 0;

document.addEventListener('DOMContentLoaded', () => {
    initDNAAnimation();
    initBackgroundAnimation();
    setupSmoothScrolling();
    setupActiveNavLink();
    animateOnScroll();
    setupMouseTracking();
    setupEasterEggToggle();
    setupPublicationsToggle();
    setupControlsToggle();
    setupResetViewButton();
});

function setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        updateMousePosition(mouseX, mouseY);
    });
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

function setupActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav ul li a');

    function updateActiveLink() {
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (scrollPosition >= sectionTop - 100 && scrollPosition < sectionTop + sectionHeight - 100) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${section.id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    window.addEventListener('load', updateActiveLink);
}

function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    function checkVisibility() {
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;
            if (elementTop < window.innerHeight && elementBottom > 0) {
                element.classList.add('in-view');
            } else {
                element.classList.remove('in-view');
            }
        });
    }

    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
    checkVisibility();
}

function setupEasterEggToggle() {
    const toggleButton = document.querySelector('.easter-egg-toggle');
    const hintBox = document.querySelector('.easter-egg-hint-box');
    const previewBox = document.querySelector('.easter-egg-preview');
    const closeButtons = document.querySelectorAll('.easter-egg-hint-box .close-button, .easter-egg-preview .close-button');
    const answerInputs = document.querySelectorAll('.easter-egg-hint-box .answer-input, .easter-egg-preview .answer-input');
    const questionParagraphs = document.querySelectorAll('.easter-egg-hint-box .question, .easter-egg-preview .question');

    const questions = [
        "What 3-letter acronym refers to the MRI modality for measuring water movement in a specific direction, used in neuroimaging to recover white matter fiber orientations?",
        "What 3-letter acronym refers to the imaging technique that uses radioactive tracers to measure brain activity?",
        "What 4-letter acronym refers to the technique that measures brain activity through changes in blood oxygenation and flow?",
        "What 3-letter acronym refers to the technique that measures cell mechanical properties using a small probe?",
        "What 3-letter acronym refers to the software package for diffusion MRI analysis, developed at Oxford?",
        "What 3-letter acronym refers to the hyperviscoelastic model used for modeling arteries and brain tissue?"
    ];    

    const answers = ["DTI", "PET", "FMRI", "AFM", "FSL", "GOH"];
    let currentQuestionIndex = 0;
    let completedQuestions = 0;

    function updateQuestion() {
        questionParagraphs.forEach(p => p.textContent = questions[currentQuestionIndex]);
        answerInputs.forEach(input => {
            input.value = '';
            input.placeholder = 'Enter your answer';
            input.readOnly = false;
        });
        hintBox.classList.remove('correct');
        previewBox.classList.remove('correct');
        
        setTimeout(() => {
            answerInputs[0].focus();
        }, 100);
    }

    function checkAnswer() {
        const userAnswer = answerInputs[0].value.trim().toUpperCase();
        if (userAnswer === answers[currentQuestionIndex]) {
            answerInputs.forEach(input => {
                input.value = '';
                input.placeholder = 'Correct!';
                input.readOnly = true;
            });
            hintBox.classList.add('correct');
            previewBox.classList.add('correct');
            
            completedQuestions++;
            if (completedQuestions === questions.length) {
                toggleEasterEgg(6, window.innerWidth, window.innerHeight);
                showCongratulationsMessage();
                closeHintBox(); // Close the hint box after completing all questions
            } else {
                toggleEasterEgg(currentQuestionIndex + 1, window.innerWidth, window.innerHeight);
            }
            
            setTimeout(() => {
                currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
                updateQuestion();
            }, 2000);
        }
    }

    function showCongratulationsMessage() {
        const message = document.createElement('div');
        message.textContent = "Congratulations! You're a true scholar!";
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 255, 0, 0.2);
            color: #00ff00;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            text-align: center;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        `;
        document.body.appendChild(message);

        setTimeout(() => {
            message.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(message);
            }, 500);
        }, 3000);
    }

    function closeHintBox() {
        hintBox.classList.remove('visible');
        previewBox.style.opacity = '0';
        previewBox.style.visibility = 'hidden';
    }

    toggleButton.addEventListener('click', () => {
        hintBox.classList.toggle('visible');
        previewBox.style.opacity = '0';
        previewBox.style.visibility = 'hidden';
        if (hintBox.classList.contains('visible')) {
            updateQuestion();
        }
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', closeHintBox);
    });

    answerInputs[0].addEventListener('input', checkAnswer);

    toggleButton.addEventListener('mouseenter', () => {
        if (!hintBox.classList.contains('visible')) {
            previewBox.style.opacity = '1';
            previewBox.style.visibility = 'visible';
            updateQuestion();
        }
    });

    toggleButton.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!previewBox.matches(':hover')) {
                previewBox.style.opacity = '0';
                previewBox.style.visibility = 'hidden';
            }
        }, 100);
    });

    previewBox.addEventListener('mouseleave', () => {
        previewBox.style.opacity = '0';
        previewBox.style.visibility = 'hidden';
    });

    previewBox.addEventListener('click', () => {
        hintBox.classList.add('visible');
        previewBox.style.opacity = '0';
        previewBox.style.visibility = 'hidden';
        updateQuestion();
    });
}

function setupControlsToggle() {
    const toggleButton = document.querySelector('.controls-toggle');
    const controlsPanel = document.querySelector('.dna-controls');
    let isHovering = false;
    let hoverTimeout;

    function wiggleControlsToggle() {
        toggleButton.classList.add('wiggle');
        setTimeout(() => toggleButton.classList.remove('wiggle'), 500);
    }

    setInterval(wiggleControlsToggle, 30000);

    function showControls() {
        clearTimeout(hoverTimeout);
        isHovering = true;
        controlsPanel.style.opacity = '1';
        controlsPanel.style.visibility = 'visible';
    }

    function hideControls() {
        isHovering = false;
        hoverTimeout = setTimeout(() => {
            if (!isHovering) {
                controlsPanel.style.opacity = '0';
                controlsPanel.style.visibility = 'hidden';
            }
        }, 300);
    }

    toggleButton.addEventListener('mouseenter', showControls);
    toggleButton.addEventListener('mouseleave', hideControls);

    controlsPanel.addEventListener('mouseenter', showControls);
    controlsPanel.addEventListener('mouseleave', hideControls);

    const controlButtons = document.querySelectorAll('.dna-control');
    controlButtons.forEach(button => {
        const key = button.getAttribute('data-key').toLowerCase();

        button.addEventListener('mouseenter', () => {
            button.setAttribute('title', button.getAttribute('data-tooltip'));
        });
        button.addEventListener('mouseleave', () => {
            button.removeAttribute('title');
        });

        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleControlButtonInteraction(key, true);
            button.classList.add('active');
        });

        button.addEventListener('mouseup', () => {
            handleControlButtonInteraction(key, false);
            button.classList.remove('active');
        });

        button.addEventListener('mouseleave', () => {
            handleControlButtonInteraction(key, false);
            button.classList.remove('active');
        });

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleControlButtonInteraction(key, true);
            button.classList.add('active');
        });

        button.addEventListener('touchend', () => {
            handleControlButtonInteraction(key, false);
            button.classList.remove('active');
        });
    });
}

function setupResetViewButton() {
    const resetButton = document.querySelector('.reset-view-button');
    resetButton.addEventListener('click', () => {
        resetView();
        toggleEasterEgg(99, window.innerWidth, window.innerHeight);
    });
}

function setupPublicationsToggle() {
    const toggleButtons = document.querySelectorAll('.publication-toggle');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const details = button.nextElementSibling;
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        button.setAttribute('aria-expanded', !isExpanded);
        details.hidden = isExpanded;
        
        // Smooth scroll to the toggled item if it's now expanded
        if (!isExpanded) {
          setTimeout(() => {
            button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 10);
        }
      });
    });
}
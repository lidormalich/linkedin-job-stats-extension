(function() {
    'use strict';

    console.log('LIDOR3333 - הסקריפט התחיל לרוץ!');

    // משתנים גלובליים
    let isInitialized = false;
    let displayElement = null;
    let interceptorsSet = false;

    // פונקציות עזר
    function createStatsDisplay() {
        if (document.getElementById('job-stats-display')) {
            console.log('LIDOR3333 - תצוגה כבר קיימת');
            return document.getElementById('job-stats-display');
        }

        const statsDiv = document.createElement('div');
        statsDiv.id = 'job-stats-display';
        statsDiv.innerHTML = `
            <div class="job-stats-section">
                <div class="job-stats-item" data-tooltip="מספר האנשים שהגישו מועמדות למשרה זו">
                    <span class="stat-label">הגשות</span>
                    <span id="applies-tag" class="stat-tag stat-default" data-loading="true">טוען</span>
                </div>
                <div class="job-stats-item" data-tooltip="מספר האנשים שצפו במשרה זו">
                    <span class="stat-label">צפיות</span>
                    <span id="views-tag" class="stat-tag stat-default" data-loading="true">טוען</span>
                </div>
                <div class="job-stats-item" data-tooltip="רמת התחרות במשרה זו - נמוכה = הזדמנות טובה">
                    <span class="stat-label">תחרות</span>
                    <span id="competition-tag" class="stat-tag stat-default" data-loading="true">טוען</span>
                </div>
            </div>
        `;

        return statsDiv;
    }

    function insertStatsDisplay() {
        // חכה קצת לטעינת הדף
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const tryInsert = () => {
                attempts++;
                console.log(`LIDOR3333 - ניסיון ${attempts}/${maxAttempts} להכניס תצוגה`);
                
                const statsDiv = createStatsDisplay();
                const h1Elements = document.querySelectorAll('h1');
                
                if (h1Elements.length > 0) {
                    const targetElement = h1Elements[0];
                    
                    // בדיקה שהמיקום מתאים
                    if (targetElement.offsetParent) { // וודא שהאלמנט נראה
                        if (targetElement.nextSibling) {
                            targetElement.parentNode.insertBefore(statsDiv, targetElement.nextSibling);
                        } else {
                            targetElement.parentNode.appendChild(statsDiv);
                        }
                        console.log('LIDOR3333 - תצוגה נוצרה בהצלחה');
                        displayElement = statsDiv;
                        resolve(true);
                        return;
                    }
                }
                
                if (attempts < maxAttempts) {
                    setTimeout(tryInsert, 500); // חכה 500ms ונסה שוב
                } else {
                    console.log('LIDOR3333 - נכשל ביצירת תצוגה אחרי כל הניסיונות');
                    resolve(false);
                }
            };
            
            tryInsert();
        });
    }

    function updateDisplay(applies, views) {
        console.log('LIDOR3333 - updateDisplay נקרא עם:', { applies, views });
        
        const appliesTag = document.getElementById('applies-tag');
        const viewsTag = document.getElementById('views-tag');
        const competitionTag = document.getElementById('competition-tag');

        if (appliesTag && viewsTag && competitionTag) {
            // חישוב תחרות וצבעים
            let competitionText = 'נמוכה מאוד';
            let competitionClass = 'stat-tag competition-low';
            let appliesClass = 'stat-tag stat-very-low';
            let viewsClass = 'stat-tag stat-low';
            
            if (applies >= 1000) {
                competitionText = 'גבוהה מאוד';
                competitionClass = 'stat-tag competition-high';
                appliesClass = 'stat-tag stat-high';
            } else if (applies >= 500) {
                competitionText = 'גבוהה';
                competitionClass = 'stat-tag competition-high';
                appliesClass = 'stat-tag stat-high';
            } else if (applies >= 200) {
                competitionText = 'בינונית';
                competitionClass = 'stat-tag competition-medium';
                appliesClass = 'stat-tag stat-medium';
            } else if (applies >= 50) {
                competitionText = 'נמוכה';
                competitionClass = 'stat-tag competition-low';
                appliesClass = 'stat-tag stat-low';
            }
            
            // צבעי views לפי מספר הצפיות
            if (views >= 1000) {
                viewsClass = 'stat-tag stat-high';
            } else if (views >= 500) {
                viewsClass = 'stat-tag stat-medium';
            } else if (views >= 100) {
                viewsClass = 'stat-tag stat-low';
            } else {
                viewsClass = 'stat-tag stat-very-low';
            }

            // עדכון כל האלמנטים
            appliesTag.textContent = applies.toLocaleString('he-IL');
            appliesTag.removeAttribute('data-loading');
            appliesTag.className = appliesClass;
            
            viewsTag.textContent = views.toLocaleString('he-IL');
            viewsTag.removeAttribute('data-loading');
            viewsTag.className = viewsClass;

            competitionTag.textContent = competitionText;
            competitionTag.removeAttribute('data-loading');
            competitionTag.className = competitionClass;

            console.log('LIDOR3333 - עודכן בהצלחה:', { 
                applies, 
                views, 
                competition: competitionText,
                appliesClass,
                viewsClass,
                competitionClass
            });
            
            return true;
        } else {
            console.log('LIDOR3333 - לא נמצאו אלמנטי תצוגה:', {
                appliesTag: !!appliesTag,
                viewsTag: !!viewsTag,
                competitionTag: !!competitionTag
            });
        }
        return false;
    }

    function searchForStatsInContent(content) {
        console.log('LIDOR3333 - מחפש נתונים בתוכן...');
        
        try {
            const data = JSON.parse(content);
            console.log('LIDOR3333 - האובייקט המלא נתקבל');
            
            let applies = 0;
            let views = 0;

            // פונקציה רקורסיבית לחיפוש נתונים
            function searchInObject(obj, depth = 0, path = '') {
                if (!obj || depth > 15 || typeof obj !== 'object') return;

                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    
                    if ((key === 'applies' || key === 'numApplicants' || key === 'applicationCount') && typeof value === 'number' && value > 0) {
                        applies = Math.max(applies, value);
                        console.log('LIDOR3333 - מצא applies:', value, 'בנתיב:', currentPath);
                    }
                    
                    if ((key === 'views' || key === 'viewCount' || key === 'numViews') && typeof value === 'number' && value > 0) {
                        views = Math.max(views, value);
                        console.log('LIDOR3333 - מצא views:', value, 'בנתיב:', currentPath);
                    }

                    if (typeof value === 'object' && value !== null) {
                        searchInObject(value, depth + 1, currentPath);
                    }
                }
            }

            searchInObject(data);

            console.log('LIDOR3333 - סיכום נתונים:', { applies, views });

            if (applies >= 0 || views > 0) { // שינוי: >= 0 במקום > 0
                return updateDisplay(applies, views);
            } else {
                console.log('LIDOR3333 - לא נמצאו נתונים מספיקים לעדכון');
            }
            
        } catch (parseErr) {
            console.log('LIDOR3333 - שגיאה בפרסור JSON:', parseErr);
            
            // חיפוש בטקסט עם יותר דפוסים
            const patterns = [
                /"(?:applies|numApplicants|applicationCount)"\s*:\s*(\d+)/g,
                /"(?:views|viewCount|numViews)"\s*:\s*(\d+)/g,
                /applicants?[\"']?\s*:\s*[\"']?(\d+)/gi,
                /views?[\"']?\s*:\s*[\"']?(\d+)/gi
            ];
            
            let applies = 0;
            let views = 0;
            
            patterns.forEach((pattern, index) => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const value = parseInt(match[1]);
                    if (value > 0) {
                        if (index < 1) { // applies patterns
                            applies = Math.max(applies, value);
                            console.log('LIDOR3333 - מצא applies בטקסט:', value);
                        } else { // views patterns
                            views = Math.max(views, value);
                            console.log('LIDOR3333 - מצא views בטקסט:', value);
                        }
                    }
                }
            });

            if (applies > 0 || views > 0) {
                return updateDisplay(applies, views);
            }
        }
        
        return false;
    }

    function setupNetworkInterception() {
        if (interceptorsSet) {
            console.log('LIDOR3333 - יירוט כבר הוגדר');
            return;
        }

        console.log('LIDOR3333 - מגדיר יירוט רשת...');

        // יירוט fetch
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
            const shouldIntercept = url.includes('voyager/api/jobs/jobPostings') || url.includes('/jobs/');
            
            if (shouldIntercept) {
                console.log('LIDOR3333 - יירטתי בקשה חשובה:', url);
            }
            
            const fetchPromise = originalFetch.apply(this, args);
            
            if (shouldIntercept) {
                return fetchPromise.then(response => {
                    if (response && response.status === 200) {
                        console.log('LIDOR3333 - תגובה התקבלה:', url);
                        
                        // יצירת clone של התגובה
                        const responseClone = response.clone();
                        responseClone.text().then(text => {
                            console.log('LIDOR3333 - אורך תגובה:', text.length);
                            if (text.length > 100) {
                                searchForStatsInContent(text);
                            }
                        }).catch(err => {
                            console.log('LIDOR3333 - שגיאה בקריאת תגובה:', err);
                        });
                    }
                    
                    return response;
                }).catch(err => {
                    console.log('LIDOR3333 - שגיאה בבקשה:', err);
                    throw err;
                });
            }
            
            return fetchPromise;
        
        };

        // יירוט XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._url = url;
            this._method = method;
            return originalXHROpen.apply(this, [method, url, ...args]);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', function() {
                const shouldIntercept = this._url && (this._url.includes('voyager/api/jobs/jobPostings') || this._url.includes('/jobs/'));
                
                if (shouldIntercept && this.status === 200) {
                    console.log('LIDOR3333 - יירטתי XHR:', this._url);
                    
                    let responseData;
                    
                    try {
                        // ניסיון לקבל את הנתונים לפי סוג התגובה
                        if (this.responseType === '' || this.responseType === 'text') {
                            responseData = this.responseText;
                        } else if (this.responseType === 'json') {
                            responseData = JSON.stringify(this.response);
                        } else if (this.responseType === 'blob') {
                            // אם זה blob, נקרא אותו כטקסט
                            const reader = new FileReader();
                            reader.onload = function() {
                                console.log('LIDOR3333 - נתונים מ-blob XHR:', typeof reader.result);
                                if (typeof reader.result === 'string' && reader.result.length > 100) {
                                    searchForStatsInContent(reader.result);
                                }
                            };
                            reader.readAsText(this.response);
                            return;
                        } else {
                            responseData = this.response;
                            if (typeof responseData === 'object') {
                                responseData = JSON.stringify(responseData);
                            }
                        }
                        
                        console.log('LIDOR3333 - responseData XHR:', {
                            type: typeof responseData,
                            length: responseData ? responseData.length : 0,
                            responseType: this.responseType,
                            url: this._url
                        });
                        
                        if (typeof responseData === 'string' && responseData.length > 100) {
                            console.log('LIDOR3333 - אורך תגובה XHR:', responseData.length);
                            searchForStatsInContent(responseData);
                        }
                        
                    } catch (err) {
                        console.log('LIDOR3333 - שגיאה בקריאת XHR response:', err);
                        
                        // ניסיון אחרון
                        try {
                            const fallbackData = this.response;
                            console.log('LIDOR3333 - fallback XHR data:', {
                                type: typeof fallbackData,
                                isString: typeof fallbackData === 'string'
                            });
                            
                            if (typeof fallbackData === 'string' && fallbackData.length > 100) {
                                searchForStatsInContent(fallbackData);
                            }
                        } catch (fallbackErr) {
                            console.log('LIDOR3333 - גם fallback XHR נכשל:', fallbackErr);
                        }
                    }
                }
            });
            
            return originalXHRSend.apply(this, args);
        };

        interceptorsSet = true;
        console.log('LIDOR3333 - יירוט רשת הוגדר');
    }

    function isJobPage() {
        const url = location.href;
        console.log('LIDOR3333 - בודק אם זה דף משרה:', url);
        
        const hasJobPattern = url.includes('/jobs/') && (
            url.includes('/view/') ||
            url.includes('/collections/') ||
            url.includes('/search/') ||
            url.includes('currentJobId=')
        );
        
        // בדיקה חזקה יותר - גם אם יש h1 עם כותרת משרה
        const h1Elements = document.querySelectorAll('h1');
        const hasJobTitle = h1Elements.length > 0;
        
        // בדיקה נוספת - אם יש אלמנטים של משרה בדף
        const hasJobElements = document.querySelector('[data-job-id]') || 
                              document.querySelector('.job-details') ||
                              document.querySelector('.jobs-search__job-details') ||
                              document.querySelector('.job-view') ||
                              document.querySelector('.jobs-details') ||
                              url.includes('currentJobId=');
        
        const isJobPage = hasJobPattern || (hasJobTitle && url.includes('/jobs/')) || hasJobElements;
        
        console.log('LIDOR3333 - תוצאות בדיקה:', { 
            url, 
            hasJobPattern, 
            hasJobTitle, 
            hasJobElements,
            h1Count: h1Elements.length,
            isJobPage 
        });
        
        return isJobPage;
    }

    function injectScript() {
        if (!window.LIDOR_INJECTED_LOADED) {
            console.log('LIDOR3333 - מזריק injected.js...');
            
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('injected.js');
            script.onload = function() {
                console.log('LIDOR3333 - injected.js נטען בהצלחה');
                window.LIDOR_INJECTED_LOADED = true;
            };
            script.onerror = function() {
                console.log('LIDOR3333 - שגיאה בטעינת injected.js');
            };
            
            (document.head || document.documentElement).appendChild(script);
        }
    }

    // פונקציה לניסיון מציאת נתונים קיימים
    function tryFindExistingData() {
        console.log('LIDOR3333 - מנסה למצוא נתונים קיימים...');
        
        // חיפוש בטקסט הדף
        const pageText = document.body.innerText || document.body.textContent || '';
        
        const patterns = [
            /(\d+)\s*(?:הגישו|הגשות|applications?|applies?)/gi,
            /(\d+)\s*(?:צפו|צפיות|views?)/gi,
            /(?:הגישו|הגשות|applications?|applies?)\s*(\d+)/gi,
            /(?:צפו|צפיות|views?)\s*(\d+)/gi
        ];
        
        let applies = 0;
        let views = 0;
        
        patterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(pageText)) !== null) {
                const value = parseInt(match[1]);
                if (value > 0) {
                    if (index % 2 === 0) { // applies patterns
                        applies = Math.max(applies, value);
                        console.log('LIDOR3333 - מצא applies בדף:', value);
                    } else { // views patterns
                        views = Math.max(views, value);
                        console.log('LIDOR3333 - מצא views בדף:', value);
                    }
                }
            }
        });
        
        if (applies > 0 || views > 0) {
            console.log('LIDOR3333 - נמצאו נתונים בדף:', { applies, views });
            return updateDisplay(applies, views);
        }
        
        return false;
    }

    // פונקציה ראשית - עכשיו async
    async function initialize() {
        if (isInitialized) {
            console.log('LIDOR3333 - כבר מאותחל');
            return;
        }

        console.log('LIDOR3333 - מתחיל אתחול');
        
        if (!isJobPage()) {
            console.log('LIDOR3333 - זה לא דף משרה, יוצא');
            return;
        }

        // הזרקת injected script
        injectScript();

        // יצירת תצוגה - עכשיו עם המתנה
        const displayCreated = await insertStatsDisplay();
        
        if (displayCreated) {
            console.log('LIDOR3333 - תצוגה נוצרה');
            
            // ניסיון למצוא נתונים קיימים
            setTimeout(() => {
                if (!tryFindExistingData()) {
                    console.log('LIDOR3333 - לא נמצאו נתונים קיימים, מחכה לבקשות...');
                }
            }, 1000);
        } else {
            console.log('LIDOR3333 - לא הצלחתי ליצור תצוגה');
        }

        // הגדרת יירוט רשת
        setupNetworkInterception();

        // מאזין להודעות מ-injected.js
        window.addEventListener('message', function(event) {
            if (event.source !== window) return;
            
            console.log('LIDOR3333 - הודעה התקבלה:', event.data);
            
            if (event.data.type === 'JOB_STATS_FOUND' && event.data.source === 'injected.js') {
                console.log('LIDOR3333 - נתונים התקבלו מ-injected.js:', event.data.stats);
                
                const { applies, views } = event.data.stats;
                if (applies >= 0 || views > 0) { // שינוי: >= 0 במקום > 0
                    updateDisplay(applies, views);
                }
            }
            
            if (event.data.type === 'RAW_RESPONSE_RECEIVED' && event.data.source === 'injected.js') {
                console.log('LIDOR3333 - תגובה גולמית התקבלה מ-injected.js');
                searchForStatsInContent(event.data.rawResponse);
            }
        });

        isInitialized = true;
        window.LIDOR_SCRIPT_LOADED = true;
        console.log('LIDOR3333 - אתחול הושלם');
    }

    // אתחול מיידי אם הדף כבר נטען
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }

    // מעקב אחר שינויים בדף עם זיהוי טוב יותר
    let lastUrl = location.href;
    const observer = new MutationObserver((mutations) => {
        const url = location.href;
        
        // בדיקה אם השתנה URL
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('LIDOR3333 - זוהה שינוי URL:', url);
            
            // איפוס
            isInitialized = false;
            interceptorsSet = false;
            const oldDisplay = document.getElementById('job-stats-display');
            if (oldDisplay) {
                oldDisplay.remove();
                console.log('LIDOR3333 - הסרתי תצוגה ישנה');
            }
            
            // הפעלה מחדש עם זמן המתנה
            setTimeout(initialize, 1500);
        } else {
            // גם אם URL לא השתנה, בדוק אם התווסף תוכן חדש למשרה
            const hasNewJobContent = document.querySelector('h1') && !document.getElementById('job-stats-display');
            
            if (hasNewJobContent && url.includes('/jobs/') && !isInitialized) {
                console.log('LIDOR3333 - זוהה תוכן חדש של משרה ללא שינוי URL');
                setTimeout(initialize, 1000);
            }
        }
    });
    
    observer.observe(document, { 
        subtree: true, 
        childList: true,
        attributes: true,
        attributeFilter: ['href', 'data-job-id'],
        characterData: false
    });

    // מאזין נוסף לאירועי navigation של לינקדאין
    window.addEventListener('popstate', function() {
        console.log('LIDOR3333 - זוהה popstate');
        setTimeout(initialize, 1000);
    });

    // מאזין לקליקים על קישורי משרות
    document.addEventListener('click', function(event) {
        const target = event.target.closest('a[href*="/jobs/"]');
        if (target) {
            console.log('LIDOR3333 - נקלק על קישור משרה:', target.href);
            setTimeout(() => {
                if (location.href.includes('/jobs/')) {
                    isInitialized = false;
                    setTimeout(initialize, 2000);
                }
            }, 500);
        }
    });

    console.log('LIDOR3333 - מעקב מתמיד מופעל');

})();
(function() {
    'use strict';

    let isInitialized = false;
    let displayElement = null;
    let interceptorsSet = false;

    
    function createStatsDisplay() {
        if (document.getElementById('job-stats-display')) {
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
        
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const tryInsert = () => {
                attempts++;
                
                const statsDiv = createStatsDisplay();
                const h1Elements = document.querySelectorAll('h1');
                
                if (h1Elements.length > 0) {
                    const targetElement = h1Elements[0];
                    
                    
                    if (targetElement.offsetParent) { 
                        if (targetElement.nextSibling) {
                            targetElement.parentNode.insertBefore(statsDiv, targetElement.nextSibling);
                        } else {
                            targetElement.parentNode.appendChild(statsDiv);
                        }
                        displayElement = statsDiv;
                        resolve(true);
                        return;
                    }
                }
                
                if (attempts < maxAttempts) {
                    setTimeout(tryInsert, 500); 
                } else {
                    resolve(false);
                }
            };
            
            tryInsert();
        });
    }

    function updateDisplay(applies, views) {
        
        const appliesTag = document.getElementById('applies-tag');
        const viewsTag = document.getElementById('views-tag');
        const competitionTag = document.getElementById('competition-tag');

        if (appliesTag && viewsTag && competitionTag) {
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
            
            if (views >= 1000) {
                viewsClass = 'stat-tag stat-high';
            } else if (views >= 500) {
                viewsClass = 'stat-tag stat-medium';
            } else if (views >= 100) {
                viewsClass = 'stat-tag stat-low';
            } else {
                viewsClass = 'stat-tag stat-very-low';
            }

            appliesTag.textContent = applies.toLocaleString('he-IL');
            appliesTag.removeAttribute('data-loading');
            appliesTag.className = appliesClass;
            
            viewsTag.textContent = views.toLocaleString('he-IL');
            viewsTag.removeAttribute('data-loading');
            viewsTag.className = viewsClass;

            competitionTag.textContent = competitionText;
            competitionTag.removeAttribute('data-loading');
            competitionTag.className = competitionClass;

            
            
            return true;
        } 
        return false;
    }

    function searchForStatsInContent(content) {
        
        try {
            const data = JSON.parse(content);
            
            let applies = 0;
            let views = 0;

            function searchInObject(obj, depth = 0, path = '') {
                if (!obj || depth > 15 || typeof obj !== 'object') return;

                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    
                    if ((key === 'applies' || key === 'numApplicants' || key === 'applicationCount' || 
                         key === 'applicants' || key === 'candidates' || key === 'submissions' ||
                         key === 'totalApplications' || key === 'applicationTotal') && 
                        typeof value === 'number' && value > 0) {
                        applies = Math.max(applies, value);
                    }
                    
                    
                    if ((key === 'views' || key === 'viewCount' || key === 'numViews' || 
                         key === 'viewers' || key === 'impressions' || key === 'clicks' ||
                         key === 'totalViews' || key === 'viewTotal') && 
                        typeof value === 'number' && value > 0) {
                        views = Math.max(views, value);
                    }

                    if (typeof value === 'object' && value !== null) {
                        searchInObject(value, depth + 1, currentPath);
                    }
                }
            }

            searchInObject(data);


            if (applies >= 0 || views > 0) { 
                return updateDisplay(applies, views);
            } else {
            }
            
        } catch (parseErr) {
            
            
            const patterns = [
                /"(?:applies|numApplicants|applicationCount|applicants|candidates|submissions)"\s*:\s*(\d+)/g,
                /"(?:views|viewCount|numViews|viewers|impressions|clicks)"\s*:\s*(\d+)/g,
                /applicants?[\"']?\s*:\s*[\"']?(\d+)/gi,
                /views?[\"']?\s*:\s*[\"']?(\d+)/gi,
                /candidates?[\"']?\s*:\s*[\"']?(\d+)/gi,
                /impressions?[\"']?\s*:\s*[\"']?(\d+)/gi
            ];
            
            let applies = 0;
            let views = 0;
            
            patterns.forEach((pattern, index) => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const value = parseInt(match[1]);
                    if (value > 0 && value < 1000000) { 
                        if (index < 2) { 
                            applies = Math.max(applies, value);
                        } else { 
                            views = Math.max(views, value);
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
            return;
        }


        
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
            
            const shouldIntercept = url && (
                url.includes('voyager/api/jobs/jobPostings') ||
                url.includes('voyager/api/jobs') ||
                url.includes('/jobs/') ||
                url.includes('jobPostings') ||
                url.includes('jobDetails')
            );
            
            
            
            const fetchPromise = originalFetch.apply(this, args);
            
            if (shouldIntercept) {
                return fetchPromise.then(response => {
                    if (response && response.status === 200) {
                        
                        const responseClone = response.clone();
                        responseClone.text().then(text => {
                            if (text.length > 100) {
                                searchForStatsInContent(text);
                            }
                        }).catch(err => {
                        });
                    }
                    
                    return response;
                }).catch(err => {
                    throw err;
                });
            }
            
            return fetchPromise;
        
        };

        
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._url = url;
            this._method = method;
            return originalXHROpen.apply(this, [method, url, ...args]);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', function() {
                
                const shouldIntercept = this._url && (
                    this._url.includes('voyager/api/jobs/jobPostings') ||
                    this._url.includes('voyager/api/jobs') ||
                    this._url.includes('/jobs/') ||
                    this._url.includes('jobPostings') ||
                    this._url.includes('jobDetails')
                );
                
                if (shouldIntercept && this.status === 200) {
                    
                    let responseData;
                    
                    try {
                        if (this.responseType === '' || this.responseType === 'text') {
                            responseData = this.responseText;
                        } else if (this.responseType === 'json') {
                            responseData = JSON.stringify(this.response);
                        } else if (this.responseType === 'blob') {
                            const reader = new FileReader();
                            reader.onload = function() {
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
                        
                        
                        
                        if (typeof responseData === 'string' && responseData.length > 100) {
                            searchForStatsInContent(responseData);
                        }
                        
                    } catch (err) {
                        
                        
                        try {
                            const fallbackData = this.response;
                            
                            
                            if (typeof fallbackData === 'string' && fallbackData.length > 100) {
                                searchForStatsInContent(fallbackData);
                            }
                        } catch (fallbackErr) {
                        }
                    }
                }
            });
            
            return originalXHRSend.apply(this, args);
        };

        interceptorsSet = true;
    }

    function isJobPage() {
        const url = location.href;
        
        
        const hasJobPattern = url.includes('/jobs/') && (
            url.includes('/view/') ||
            url.includes('/collections/') ||
            url.includes('/search/') ||
            url.includes('currentJobId=') ||
            url.includes('refId=') ||
            url.includes('trackingId=') ||
            /\/jobs\/view\/\d+/.test(url) || 
            /\/jobs\/\d+/.test(url) 
        );
        
        
        const h1Elements = document.querySelectorAll('h1');
        const hasJobTitle = h1Elements.length > 0;
        
        
        const hasJobElements = document.querySelector('[data-job-id]') || 
                              document.querySelector('.job-details') ||
                              document.querySelector('.jobs-search__job-details') ||
                              document.querySelector('.job-view') ||
                              document.querySelector('.jobs-details') ||
                              document.querySelector('.jobs-unified-top-card') ||
                              document.querySelector('.jobs-description') ||
                              url.includes('currentJobId=');
        
        
        const hasJobContent = document.querySelector('.jobs-unified-top-card__job-title') ||
                             document.querySelector('.jobs-description__content') ||
                             document.querySelector('.jobs-box__title') ||
                             document.querySelector('.jobs-search__job-details-header');
        
        const isJobPage = hasJobPattern || 
                         (hasJobTitle && url.includes('/jobs/')) || 
                         hasJobElements || 
                         hasJobContent;
        
        
        
        return isJobPage;
    }

    function injectScript() {
        if (!window.LIDOR_INJECTED_LOADED) {
            
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('injected.js');
            script.onload = function() {
                window.LIDOR_INJECTED_LOADED = true;
            };
            script.onerror = function() {
            };
            
            (document.head || document.documentElement).appendChild(script);
        }
    }

    
    function tryFindExistingData() {
        
        
        const pageText = document.body.innerText || document.body.textContent || '';
        
        
        const patterns = [
            
            /(\d+)\s*(?:הגישו|הגשות|applications?|applies?|מועמדים?|candidates?)/gi,
            /(\d+)\s*(?:צפו|צפיות|views?|צופים?|impressions?)/gi,
            /(?:הגישו|הגשות|applications?|applies?|מועמדים?|candidates?)\s*(\d+)/gi,
            /(?:צפו|צפיות|views?|צופים?|impressions?)\s*(\d+)/gi,
            
            
            /(\d+)\s*(?:applications?|applies?|applicants?|candidates?|submissions?)/gi,
            /(\d+)\s*(?:views?|viewers?|impressions?|clicks?|visits?)/gi,
            /(?:applications?|applies?|applicants?|candidates?|submissions?)\s*(\d+)/gi,
            /(?:views?|viewers?|impressions?|clicks?|visits?)\s*(\d+)/gi,
            
            
            /(\d+)[.,]\s*(?:applications?|applies?|applicants?|candidates?)/gi,
            /(\d+)[.,]\s*(?:views?|viewers?|impressions?|clicks?)/gi,
            
            
            /\((\d+)\s*(?:applications?|applies?|applicants?|candidates?)\)/gi,
            /\((\d+)\s*(?:views?|viewers?|impressions?|clicks?)\)/gi,
            
            
            /(\d+)\s*(?:people|persons|users|members|profiles)/gi,
            /(\d+)\s*(?:have|has|had)\s*(?:applied|viewed|seen|visited)/gi,
            
            
            /(\d+)\s*(?:אנשים|משתמשים|פרופילים|חברים)/gi,
            /(\d+)\s*(?:הגישו|צפו|ראו|ביקרו)/gi
        ];
        
        let applies = 0;
        let views = 0;
        
        patterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(pageText)) !== null) {
                const value = parseInt(match[1]);
                if (value > 0 && value < 1000000) { 
                    if (index < 16) { 
                        applies = Math.max(applies, value);
                    } else { 
                        views = Math.max(views, value);
                    }
                }
            }
        });
        
        
        const specificElements = [
            '.jobs-unified-top-card__job-insight',
            '.jobs-unified-top-card__subtitle',
            '.jobs-box__subtitle',
            '.jobs-description__content',
            '.jobs-search__job-details-header',
            '.jobs-unified-top-card__content',
            '.jobs-box__content',
            '.jobs-description__text',
            '.jobs-search__job-details-content'
        ];
        
        specificElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent || element.innerText || '';
                if (text) {
                    patterns.forEach((pattern, index) => {
                        let match;
                        while ((match = pattern.exec(text)) !== null) {
                            const value = parseInt(match[1]);
                            if (value > 0 && value < 1000000) {
                                if (index < 16) { 
                                    applies = Math.max(applies, value);
                                    
                                } else { 
                                    views = Math.max(views, value);
                                    
                                }
                            }
                        }
                    });
                }
            });
        });
        
        if (applies > 0 || views > 0) {
            return updateDisplay(applies, views);
        }
        
        return false;
    }

        
    async function initialize() {
        if (isInitialized) {
            return;
        }

        
        if (!isJobPage()) {
            return;
        }

        
        injectScript();

        
        const displayCreated = await insertStatsDisplay();
        
        if (displayCreated) {
            
            
            setTimeout(() => {
                if (!tryFindExistingData()) {
                    setTimeout(() => {
                        if (!tryFindExistingData()) {
                            setTimeout(() => {
                                if (!tryFindExistingData()) {
                                    console.log('לא נמצאו נתונים קיימים, מחכה לבקשות...');
                                }
                            }, 2000);
                        }
                    }, 1500);
                }
            }, 1000);
            
            
            const isComplexJobPage = location.href.includes('refId=') || 
                                     location.href.includes('trackingId=') || 
                                     /\/jobs\/view\/\d+/.test(location.href);
            
            if (isComplexJobPage) {
                setTimeout(() => {
                    tryFindExistingData();
                }, 5000);
            }
        } else {
        }

        setupNetworkInterception();

        window.addEventListener('message', function(event) {
            if (event.source !== window) return;
            
            
            if (event.data.type === 'JOB_STATS_FOUND' && event.data.source === 'injected.js') {
                
                const { applies, views } = event.data.stats;
                if (applies >= 0 || views > 0) { 
                    updateDisplay(applies, views);
                }
            }
            
            if (event.data.type === 'RAW_RESPONSE_RECEIVED' && event.data.source === 'injected.js') {
                searchForStatsInContent(event.data.rawResponse);
            }
        });

        isInitialized = true;
    }

    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        
        const isComplexJobPage = location.href.includes('refId=') || 
                                 location.href.includes('trackingId=') || 
                                 /\/jobs\/view\/\d+/.test(location.href);
        const delay = isComplexJobPage ? 500 : 100;
        setTimeout(initialize, delay);
    }

    
    let lastUrl = location.href;
    const observer = new MutationObserver((mutations) => {
        const url = location.href;
        
        
        if (url !== lastUrl) {
            lastUrl = url;
            
            
            isInitialized = false;
            interceptorsSet = false;
            const oldDisplay = document.getElementById('job-stats-display');
            if (oldDisplay) {
                oldDisplay.remove();
            }
            
            
            const isComplexJobPage = url.includes('refId=') || url.includes('trackingId=') || /\/jobs\/view\/\d+/.test(url);
            const delay = isComplexJobPage ? 3000 : 1500;
            setTimeout(initialize, delay);
        } else {
            
            const hasNewJobContent = document.querySelector('h1') && !document.getElementById('job-stats-display');
            const hasJobElements = document.querySelector('.jobs-unified-top-card') || 
                                  document.querySelector('.jobs-description') ||
                                  document.querySelector('.jobs-search__job-details-header');
            
            if ((hasNewJobContent || hasJobElements) && url.includes('/jobs/') && !isInitialized) {
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

    
    window.addEventListener('popstate', function() {
        
        const isComplexJobPage = location.href.includes('refId=') || 
                                 location.href.includes('trackingId=') || 
                                 /\/jobs\/view\/\d+/.test(location.href);
        const delay = isComplexJobPage ? 2500 : 1000;
        setTimeout(initialize, delay);
    });

    
    document.addEventListener('click', function(event) {
        const target = event.target.closest('a[href*="/jobs/"]');
        if (target) {
            setTimeout(() => {
                if (location.href.includes('/jobs/')) {
                    isInitialized = false;
                    
                    const isComplexJobPage = location.href.includes('refId=') || 
                                           location.href.includes('trackingId=') || 
                                           /\/jobs\/view\/\d+/.test(location.href);
                    const delay = isComplexJobPage ? 3000 : 2000;
                    setTimeout(initialize, delay);
                }
            }, 500);
        }
    });



})();
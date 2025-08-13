chrome.runtime.onInstalled.addListener(() => {
    // console.log('🎉 LinkedIn Job Stats Revealer הותקן בהצלחה!');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log('📨 הודעה התקבלה:', request);
    
    if (request.action === 'getJobStats') {
        // console.log('📊 בקשה לנתוני משרה מהתוסף');
        sendResponse({success: true, message: 'התוסף פעיל'});
    }
    
    if (request.action === 'debugInfo') {
        // console.log('🐛 מידע דיבוג:', request.data);
        sendResponse({success: true, message: 'מידע דיבוג נשמר'});
    }
    
    return true;
});

async function injectScripts(tabId) {
    try {
        // הזרקת content script
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        
        // הזרקת CSS
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ['styles.css']
        });
        
        // console.log('🔄 הוזרקו הסקריפטים בהצלחה');
        return true;
        
    } catch (err) {
        // console.log('ℹ️ לא ניתן להזריק קוד לטאב זה:', err.message);
        return false;
    }
}

async function checkScriptStatus(tabId) {
    try {
        const result = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                return {
                    hasDisplay: !!document.getElementById('job-stats-display'),
                    url: window.location.href,
                    title: document.title,
                    h1Count: document.querySelectorAll('h1').length,
                    isLoaded: window.LIDOR_SCRIPT_LOADED || false
                };
            }
        });
        
        const pageInfo = result[0].result;
        // console.log('📊 מידע דף:', pageInfo);
        
        return pageInfo;
        
    } catch (err) {
        // console.log('ℹ️ שגיאה בבדיקה:', err.message);
        return null;
    }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const isLinkedInJobs = tab.url.includes('linkedin.com/jobs');
        
        if (isLinkedInJobs) {
            console.log('✅ נכנס לדף משרות בלינקדאין:', tab.url);
            
            const injected = await injectScripts(tabId);
            
            if (injected) {
                // בדיקה שהסקריפטים עובדים
                setTimeout(async () => {
                    const pageInfo = await checkScriptStatus(tabId);
                    
                    if (pageInfo && !pageInfo.isLoaded) {
                        // console.log('⚠️ הסקריפט לא נטען, מנסה הזרקה חוזרת...');
                        await injectScripts(tabId);
                    }
                }, 2000);
            }
        }
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        
        if (tab.url && tab.url.includes('linkedin.com/jobs')) {
            // console.log('🔄 מעבר לטאב משרות פעיל:', tab.url);
            
            chrome.tabs.sendMessage(activeInfo.tabId, {
                action: 'tabActivated',
                url: tab.url
            }).catch(err => {
                // console.log('ℹ️ לא ניתן לשלוח הודעה לטאב:', err.message);
            });
        }
    } catch (err) {
        // console.log('ℹ️ שגיאה במעקב טאב פעיל:', err.message);
    }
});

chrome.action.onClicked.addListener(async (tab) => {
    // console.log('🖱️ לחיצה על אייקון התוסף');
    
    if (tab.url && tab.url.includes('linkedin.com')) {
        const pageInfo = await checkScriptStatus(tab.id);
        
        if (pageInfo) {
            if (pageInfo.isLoaded) {
                if (pageInfo.hasDisplay) {
                    alert('✅ התוסף פועל בדף זה!');
                } else {
                    alert('⚠️ התוסף פועל אבל אין תצוגה. נסה לרענן את הדף.');
                }
            } else {
                alert('❌ התוסף לא פועל. מנסה להפעיל...');
                await injectScripts(tab.id);
            }
        } else {
            alert('ℹ️ התוסף פועל רק בדפי משרות של לינקדאין');
        }
    } else {
        // console.log('ℹ️ לא בדף לינקדאין');
        chrome.tabs.create({
            url: 'https://www.linkedin.com/jobs/'
        });
    }
});

function updateBadge(tabId, status) {
    switch (status) {
        case 'working':
            chrome.action.setBadgeText({text: '✓', tabId: tabId});
            chrome.action.setBadgeBackgroundColor({color: '#22c55e', tabId: tabId});
            break;
        case 'loading':
            chrome.action.setBadgeText({text: '...', tabId: tabId});
            chrome.action.setBadgeBackgroundColor({color: '#3b82f6', tabId: tabId});
            break;
        case 'error':
            chrome.action.setBadgeText({text: '!', tabId: tabId});
            chrome.action.setBadgeBackgroundColor({color: '#ef4444', tabId: tabId});
            break;
        default:
            chrome.action.setBadgeText({text: '', tabId: tabId});
    }
}

// בדיקה תקופתית של סטטוס הטאבים
setInterval(async () => {
    try {
        const tabs = await chrome.tabs.query({
            url: ['*://www.linkedin.com/jobs/*', '*://il.linkedin.com/jobs/*']
        });
        
        // console.log(`🔍 נמצאו ${tabs.length} טאבי משרות פעילים`);
        
        for (const tab of tabs) {
            const pageInfo = await checkScriptStatus(tab.id);
            
            if (pageInfo && pageInfo.isLoaded) {
                updateBadge(tab.id, 'working');
            } else {
                updateBadge(tab.id, 'error');
                // console.log(`⚠️ טאב ${tab.id} - הסקריפט לא פועל`);
            }
        }
    } catch (err) {
        // console.log('❌ שגיאה בבדיקה תקופתית:', err.message);
    }
}, 60000);

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // console.log('🎉 התוסף הותקן לראשונה!');
    } else if (details.reason === 'update') {
        console.log('🔄 התוסף עודכן לגרסה:', chrome.runtime.getManifest().version);
    }
});

chrome.runtime.onSuspend.addListener(() => {
    console.log('💤 התוסף נכנס למצב המתנה');
});

chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 התוסף הופעל מחדש');
});
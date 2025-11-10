# Quick fix script for missing divs
$widgetDir = "c:\Users\lukes\Desktop\DNA\resources\js\Components\Dashboard\Widgets"
$widgets = @(
    "ActivityFeedWidget.jsx", 
    "PayrollSummaryWidget.jsx",
    "UpcomingEventsWidget.jsx", 
    "SiteAnnouncementsWidget.jsx",
    "EquipmentStatusWidget.jsx",
    "MyDocumentsWidget.jsx",
    "FeedbackSupportWidget.jsx"
)

foreach ($widget in $widgets) {
    $filePath = Join-Path $widgetDir $widget
    if (Test-Path $filePath) {
        Write-Host "Checking $widget..."
        
        $content = Get-Content $filePath -Raw
        
        # If file ends with just one closing div before ); }, add an extra closing div
        if ($content -match "            </div>\s*\);\s*}\s*export") {
            $content = $content -replace "(            </div>)(\s*\);\s*}\s*export)", '            </div>$0        </div>$2'
            Set-Content $filePath $content -NoNewline
            Write-Host "Added missing div to $widget"
        }
    }
}
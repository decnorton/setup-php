param (
    [Parameter(Mandatory=$true)][string]$version = "7.3",
    [Parameter(Mandatory=$true)][string]$dir
)

$tick = ([char]8730)
$cross = ([char]10007)

Function Step-Log($message) {
  printf "\n\033[90;1m==> \033[0m\033[37;1m%s \033[0m\n" $message
}

Function Add-Log($mark, $subject, $message) {
  $code = if($mark -eq $cross) {"31"} else {"32"}
  printf "\033[%s;1m%s \033[0m\033[34;1m%s \033[0m\033[90;1m%s \033[0m\n" $code $mark $subject $message
}

if($version -eq '7.4') {
	$version = '7.4RC'
}

Step-Log "Setup PhpManager"
Install-Module -Name PhpManager -Force -Scope CurrentUser
Add-Log $tick "PhpManager" "Installed"

$installed = $($(php -v)[0] -join '')[4..6] -join ''
Step-Log "Setup PHP and Composer"
$status = "Switched to PHP$version"
if($installed -ne $version) {
  if($version -lt '7.0') {
    Install-Module -Name VcRedist -Force
  }
  Install-Php -Version $version -Architecture x86 -ThreadSafe $true -InstallVC -Path C:\tools\php -TimeZone UTC -InitialPhpIni Production -Force 
  $status = "Installed PHP$version"
}

$ext_dir = "C:\tools\php\ext"
Add-Content C:\tools\php\php.ini "date.timezone = 'UTC'"
Set-PhpIniKey extension_dir $ext_dir
if($version -lt '7.4') {
  Enable-PhpExtension openssl
  Enable-PhpExtension curl
} else {
  Add-Content C:\tools\php\php.ini "extension=php_openssl.dll`nextension=php_curl.dll"
  Copy-Item $dir"\..\src\ext\php_pcov.dll" -Destination $ext_dir"\php_pcov.dll"
}
Add-Log $tick "PHP" $status

Install-Composer -Scope System -Path C:\tools\php
Add-Log $tick "Composer" "Installed"

Function Add-Extension($extension, $install_command, $prefix)
{
  try {
    $existing_extensions = Get-PhpExtension -Path C:\tools\php
    $match = @($existing_extensions | Where-Object { $_.Name -like $extension })
    if(!(php -m | findstr -i ${extension}) -and $match) {
      $filename = $match."Filename".split('\')[-1]
      Add-Content C:\tools\php\php.ini "`n$prefix=$filename"
      Add-Log $tick $extension "Enabled"
    } elseif(php -m | findstr -i $extension) {
      Add-Log $tick $extension "Enabled"
    }
  } catch [Exception] {
    Add-Log $cross $extension "Could not enable"
  }

  $status = 404
  try  {
    $status = (Invoke-WebRequest -Uri "https://pecl.php.net/json.php?package=$extension" -UseBasicParsing -DisableKeepAlive).StatusCode
  } catch [Exception] {
    $status = 500
  }

  if($status -eq 200) {
    if(!(php -m | findstr -i $extension)) {
      try {
        Invoke-Expression $install_command
        Add-Log $tick $extension "Installed and enabled"
      } catch [Exception] {
        Add-Log $cross $extension "Could not install on PHP$version"
      }
    }
  } else {
    if(!(php -m | findstr -i $extension)) {
      Add-Log $cross $extension "Could not find $extension for PHP$version on PECL"
    }
  }
}
$base = "http://localhost:3000"
$email = "u$(Get-Random)@t.com"
$r = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType "application/json" -Body (@{email=$email;password="secret1";name="T"} | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($r.token)" }
$a1 = (Invoke-RestMethod -Method Post -Uri "$base/api/accounts/create" -Headers $h).account._id
$a2 = (Invoke-RestMethod -Method Post -Uri "$base/api/accounts/create" -Headers $h).account._id

$body = @{fromAccount=$a1;toAccount=$a2;amount=50;idempotencyKey=[guid]::NewGuid().ToString()} | ConvertTo-Json
$req = [System.Net.HttpWebRequest]::Create("$base/api/transactions")
$req.Method = "POST"
$req.ContentType = "application/json"
$req.Headers.Add("Authorization", "Bearer $($r.token)")
$bytes = [Text.Encoding]::UTF8.GetBytes($body)
$req.ContentLength = $bytes.Length
$rs = $req.GetRequestStream()
$rs.Write($bytes, 0, $bytes.Length)
$rs.Close()
try {
  $resp = $req.GetResponse()
} catch [System.Net.WebException] {
  $resp = $_.Exception.Response
}
$sr = New-Object IO.StreamReader($resp.GetResponseStream())
Write-Output "HTTP $(([int]$resp.StatusCode))"
Write-Output $sr.ReadToEnd()

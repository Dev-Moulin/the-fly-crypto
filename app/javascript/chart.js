let chart = null;
let series = null;
let socket = null;
let currentInterval = '1m';

document.addEventListener('turbo:load', async function () {
    if (chart) {
        chart.remove();
        chart = null;
        series = null;
    }
    if (socket) {
        socket.close();
        socket = null;
    }

    const container = document.getElementById('chart');
    const symbol = document.getElementById('crypto-symbol').textContent;

    chart = LightweightCharts.createChart(container, {
        layout: {
            textColor: 'white',
            background: { type: 'solid', color: 'transparent' },
        },
        grid: {
            vertLines: { visible: false },
            horzLines: { visible: false }
        },
        timeScale: {
            visible: true,
            borderVisible: false,
        },
        priceScale: {
            visible: false,
            borderVisible: false,
            scaleMargins: {
                top: 0,
                bottom: 0,
            },
            labelVisible: false,
        },
    });

    series = chart.addCandlestickSeries({
        upColor: '#24EC20',
        downColor: '#DC1C31',
        wickUpColor: '#24EC20',
        wickDownColor: '#DC1C31',
        borderVisible: false,
        wickVisible: true,
        barWidth: 1,
    });

    async function fetchHistoricalData(interval) {
        const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=70`
        );
        const data = await response.json();

        return data.map(candle => ({
            time: candle[0] / 1000,
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
        }));
    }

    async function updateChart(interval) {
        const historicalData = await fetchHistoricalData(interval);
        series.setData(historicalData);
        chart.timeScale().fitContent();
    }

    await updateChart(currentInterval);

    function setActiveButton(activeButtonId) {
        const buttons = document.querySelectorAll('.choice');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
        document.getElementById(activeButtonId).classList.add('active');
    }

    setActiveButton('btn-15m');

    document.getElementById('btn-1m').addEventListener('click', async function () {
        setActiveButton('btn-1m');
        currentInterval = '1m';
        await updateChart(currentInterval);
        restartSocket();
    });

    document.getElementById('btn-15m').addEventListener('click', async function () {
        setActiveButton('btn-15m');
        currentInterval = '15m';
        await updateChart(currentInterval);
        restartSocket();
    });

    document.getElementById('btn-1h').addEventListener('click', async function () {
        setActiveButton('btn-1h');
        currentInterval = '1h';
        await updateChart(currentInterval);
        restartSocket();
    });

    document.getElementById('btn-4h').addEventListener('click', async function () {
        setActiveButton('btn-4h');
        currentInterval = '4h';
        await updateChart(currentInterval);
        restartSocket();
    });

    document.getElementById('btn-6h').addEventListener('click', async function () {
        setActiveButton('btn-1d-main');
        currentInterval = '6h';
        await updateChart(currentInterval);
        restartSocket();
    });

    document.getElementById('btn-12h').addEventListener('click', async function () {
        setActiveButton('btn-1d-main');
        currentInterval = '12h';
        await updateChart(currentInterval);
        restartSocket();
    });

    document.getElementById('btn-1d').addEventListener('click', async function () {
        setActiveButton('btn-1d-main');
        currentInterval = '1d';
        await updateChart(currentInterval);
        restartSocket();
    });

    function restartSocket() {
        if (socket) {
            socket.close();
        }

        socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@kline_${currentInterval}`);

        socket.onmessage = function (event) {
            const message = JSON.parse(event.data);

            if (message.k) {
                const candlestick = message.k;

                const update = {
                    time: candlestick.t / 1000,
                    open: parseFloat(candlestick.o),
                    high: parseFloat(candlestick.h),
                    low: parseFloat(candlestick.l),
                    close: parseFloat(candlestick.c),
                };

                if (candlestick.x) {
                    series.update(update);
                } else {
                    series.update(update);
                }
            }
        };
    }

    chart.priceScale('right').applyOptions({
        visible: true,
        borderVisible: false,
        labelVisible: true,
        scaleMargins: { top: 0, bottom: 0 },
        alignLabels: 'right',
        showLastPrice: true,
    });
});
